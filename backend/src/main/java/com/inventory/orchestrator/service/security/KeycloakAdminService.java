package com.inventory.orchestrator.service.security;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.ws.rs.core.Response;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing Keycloak users via Admin REST API.
 * This service allows ADMIN role users to create, enable, disable, and assign roles to users.
 */
@Service
public class KeycloakAdminService {

    private static final Logger logger = LoggerFactory.getLogger(KeycloakAdminService.class);

    @Value("${keycloak.server-url:http://localhost:8180}")
    private String serverUrl;

    @Value("${keycloak.realm:inventory-orchestrator}")
    private String realm;

    /**
     * Realm used to authenticate admin REST calls (admin user typically lives in "master")
     */
    @Value("${keycloak.admin-realm:master}")
    private String adminRealm;

    @Value("${keycloak.admin-client-id:admin-cli}")
    private String adminClientId;

    @Value("${keycloak.admin-client-secret:}")
    private String adminClientSecret;

    @Value("${keycloak.admin-username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin-password:admin}")
    private String adminPassword;

    /**
     * Get Keycloak admin client instance
     */
    private Keycloak getKeycloakAdminClient() {
        return KeycloakBuilder.builder()
            .serverUrl(serverUrl)
            .realm(adminRealm)
            .clientId(adminClientId)
            .clientSecret(adminClientSecret)
            .username(adminUsername)
            .password(adminPassword)
            .build();
    }

    /**
     * Create a new user in Keycloak
     */
    public String createUser(String username, String email, String firstName, String lastName, 
                            String password, boolean enabled, List<String> roles) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            UserRepresentation user = new UserRepresentation();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(enabled);
            user.setEmailVerified(false);

            // Create user
            Response response = usersResource.create(user);
            if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {
                String error = response.readEntity(String.class);
                logger.error("Failed to create user: {}", error);
                throw new RuntimeException("Failed to create user: " + error);
            }

            // Get user ID from location header
            String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");

            // Set password
            if (password != null && !password.isEmpty()) {
                CredentialRepresentation credential = new CredentialRepresentation();
                credential.setType(CredentialRepresentation.PASSWORD);
                credential.setValue(password);
                credential.setTemporary(false);
                usersResource.get(userId).resetPassword(credential);
            }

            // Assign roles
            if (roles != null && !roles.isEmpty()) {
                assignRolesToUser(userId, roles);
            }

            logger.info("User created successfully: username={}, userId={}", username, userId);
            return userId;
        } catch (Exception e) {
            logger.error("Error creating user: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }

    /**
     * Enable or disable a user
     */
    public void setUserEnabled(String userId, boolean enabled) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            
            UserRepresentation user = usersResource.get(userId).toRepresentation();
            user.setEnabled(enabled);
            usersResource.get(userId).update(user);
            
            logger.info("User {} {}: userId={}", enabled ? "enabled" : "disabled", userId);
        } catch (Exception e) {
            logger.error("Error updating user status: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update user status: " + e.getMessage(), e);
        }
    }

    /**
     * Assign roles to a user
     */
    public void assignRolesToUser(String userId, List<String> roleNames) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            
            // Get realm roles
            var realmRolesResource = realmResource.roles();
            List<org.keycloak.representations.idm.RoleRepresentation> rolesToAssign = roleNames.stream()
                .map(roleName -> {
                    try {
                        return realmRolesResource.get(roleName).toRepresentation();
                    } catch (Exception e) {
                        logger.warn("Role not found: {}", roleName);
                        return null;
                    }
                })
                .filter(role -> role != null)
                .collect(Collectors.toList());

            if (!rolesToAssign.isEmpty()) {
                usersResource.get(userId).roles().realmLevel().add(rolesToAssign);
                logger.info("Roles assigned to user: userId={}, roles={}", userId, roleNames);
            }
        } catch (Exception e) {
            logger.error("Error assigning roles: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to assign roles: " + e.getMessage(), e);
        }
    }

    /**
     * Remove roles from a user
     */
    public void removeRolesFromUser(String userId, List<String> roleNames) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            
            var realmRolesResource = realmResource.roles();
            List<org.keycloak.representations.idm.RoleRepresentation> rolesToRemove = roleNames.stream()
                .map(roleName -> {
                    try {
                        return realmRolesResource.get(roleName).toRepresentation();
                    } catch (Exception e) {
                        logger.warn("Role not found: {}", roleName);
                        return null;
                    }
                })
                .filter(role -> role != null)
                .collect(Collectors.toList());

            if (!rolesToRemove.isEmpty()) {
                usersResource.get(userId).roles().realmLevel().remove(rolesToRemove);
                logger.info("Roles removed from user: userId={}, roles={}", userId, roleNames);
            }
        } catch (Exception e) {
            logger.error("Error removing roles: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to remove roles: " + e.getMessage(), e);
        }
    }

    /**
     * Get user by username
     */
    public UserRepresentation getUserByUsername(String username) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            
            List<UserRepresentation> users = usersResource.search(username, true);
            if (users.isEmpty()) {
                return null;
            }
            return users.get(0);
        } catch (Exception e) {
            logger.error("Error getting user: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get user: " + e.getMessage(), e);
        }
    }

    /**
     * List all users
     */
    public List<UserRepresentation> listUsers(int first, int max) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            
            return usersResource.list(first, max);
        } catch (Exception e) {
            logger.error("Error listing users: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to list users: " + e.getMessage(), e);
        }
    }
}
