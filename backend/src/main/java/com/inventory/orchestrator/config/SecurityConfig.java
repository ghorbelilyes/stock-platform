package com.inventory.orchestrator.config;

import com.inventory.orchestrator.security.AuditLoggingFilter;
import com.inventory.orchestrator.security.KeycloakJwtAuthenticationConverter;
import com.inventory.orchestrator.service.AuditService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final AuditService auditService;

    public SecurityConfig(AuditService auditService) {
        this.auditService = auditService;
    }

    @Bean
    public KeycloakJwtAuthenticationConverter jwtAuthenticationConverter() {
        return new KeycloakJwtAuthenticationConverter();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configure(http))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (health checks, API docs)
                .requestMatchers("/actuator/health", "/swagger-ui/**", "/api-docs/**", "/v3/api-docs/**").permitAll()
                
                // Admin only endpoints
                .requestMatchers("/files/**").hasRole("ADMIN")
                .requestMatchers("/transfers/suggestions/approve").hasRole("ADMIN")
                
                // Admin + Manager endpoints
                .requestMatchers("/transfers/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers("/stocks/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers("/sales/**").hasAnyRole("ADMIN", "MANAGER")
                
                // All authenticated users
                .requestMatchers("/products/**").authenticated()
                .requestMatchers("/categories/**").authenticated()
                .requestMatchers("/transfers/suggestions").authenticated()
                
                // Admin audit logs and user management
                .requestMatchers("/admin/audit-logs/**").hasRole("ADMIN")
                .requestMatchers("/admin/users/**").hasRole("ADMIN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .addFilterAfter(new AuditLoggingFilter(auditService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
