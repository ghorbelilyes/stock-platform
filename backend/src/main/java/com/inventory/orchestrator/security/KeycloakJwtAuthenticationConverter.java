package com.inventory.orchestrator.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Custom JWT authentication converter that extracts Keycloak roles from JWT
 * and maps them to Spring Security roles.
 * 
 * Keycloak roles are expected in: realm_access.roles
 * Maps: ADMIN -> ROLE_ADMIN, MANAGER -> ROLE_MANAGER, USER -> ROLE_USER
 */
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter defaultConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
            defaultConverter.convert(jwt).stream(),
            extractKeycloakRoles(jwt).stream()
        ).collect(Collectors.toList());

        return new JwtAuthenticationToken(jwt, authorities);
    }

    /**
     * Extract Keycloak realm roles from JWT and map them to Spring Security roles.
     * 
     * Expected JWT structure:
     * {
     *   "realm_access": {
     *     "roles": ["ADMIN", "MANAGER", "USER"]
     *   }
     * }
     */
    private Collection<GrantedAuthority> extractKeycloakRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        
        if (realmAccess == null) {
            return List.of();
        }

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) realmAccess.get("roles");
        
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }

        return roles.stream()
            .map(this::mapKeycloakRoleToSpringRole)
            .filter(role -> role != null)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    }

    /**
     * Map Keycloak role to Spring Security role format.
     * ADMIN -> ROLE_ADMIN
     * MANAGER -> ROLE_MANAGER
     * USER -> ROLE_USER
     */
    private String mapKeycloakRoleToSpringRole(String keycloakRole) {
        if (keycloakRole == null || keycloakRole.trim().isEmpty()) {
            return null;
        }

        String normalizedRole = keycloakRole.trim().toUpperCase();
        
        return switch (normalizedRole) {
            case "ADMIN" -> "ROLE_ADMIN";
            case "MANAGER" -> "ROLE_MANAGER";
            case "USER" -> "ROLE_USER";
            default -> null; // Ignore unknown roles
        };
    }
}
