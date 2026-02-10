package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.service.security.KeycloakAdminService;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only controller for managing Keycloak users.
 */
@RestController
@RequestMapping("/admin/users")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final KeycloakAdminService keycloakAdminService;

    @Autowired
    public AdminUserController(KeycloakAdminService keycloakAdminService) {
        this.keycloakAdminService = keycloakAdminService;
    }

    /**
     * Create a new user in Keycloak
     */
    @PostMapping
    public ResponseEntity<ApiResponse<String>> createUser(@RequestBody CreateUserRequest request) {
        try {
            String userId = keycloakAdminService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                request.getPassword(),
                request.isEnabled(),
                request.getRoles()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(userId, "User created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("USER_CREATION_ERROR", e.getMessage(), List.of()));
        }
    }

    /**
     * Enable or disable a user
     */
    @PutMapping("/{userId}/enabled")
    public ResponseEntity<ApiResponse<Void>> setUserEnabled(
        @PathVariable String userId,
        @RequestBody Map<String, Boolean> request
    ) {
        try {
            Boolean enabled = request.get("enabled");
            if (enabled == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_REQUEST", "enabled field is required", List.of()));
            }
            keycloakAdminService.setUserEnabled(userId, enabled);
            return ResponseEntity.ok(ApiResponse.success(null, "User status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("USER_UPDATE_ERROR", e.getMessage(), List.of()));
        }
    }

    /**
     * Assign roles to a user
     */
    @PostMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<Void>> assignRoles(
        @PathVariable String userId,
        @RequestBody Map<String, List<String>> request
    ) {
        try {
            List<String> roles = request.get("roles");
            if (roles == null || roles.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_REQUEST", "roles field is required", List.of()));
            }
            keycloakAdminService.assignRolesToUser(userId, roles);
            return ResponseEntity.ok(ApiResponse.success(null, "Roles assigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("ROLE_ASSIGNMENT_ERROR", e.getMessage(), List.of()));
        }
    }

    /**
     * Remove roles from a user
     */
    @DeleteMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<Void>> removeRoles(
        @PathVariable String userId,
        @RequestBody Map<String, List<String>> request
    ) {
        try {
            List<String> roles = request.get("roles");
            if (roles == null || roles.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_REQUEST", "roles field is required", List.of()));
            }
            keycloakAdminService.removeRolesFromUser(userId, roles);
            return ResponseEntity.ok(ApiResponse.success(null, "Roles removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("ROLE_REMOVAL_ERROR", e.getMessage(), List.of()));
        }
    }

    /**
     * Get user by username
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<UserRepresentation>> getUserByUsername(
        @RequestParam String username
    ) {
        try {
            UserRepresentation user = keycloakAdminService.getUserByUsername(username);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("USER_SEARCH_ERROR", e.getMessage(), List.of()));
        }
    }

    /**
     * List all users
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserRepresentation>>> listUsers(
        @RequestParam(defaultValue = "0") int first,
        @RequestParam(defaultValue = "20") int max
    ) {
        try {
            List<UserRepresentation> users = keycloakAdminService.listUsers(first, max);
            return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("USER_LIST_ERROR", e.getMessage(), List.of()));
        }
    }

    /**
     * Request DTO for creating a user
     */
    public static class CreateUserRequest {
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String password;
        private boolean enabled = true;
        private List<String> roles;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public List<String> roles() {
            return roles;
        }

        public List<String> getRoles() {
            return roles;
        }

        public void setRoles(List<String> roles) {
            this.roles = roles;
        }
    }
}
