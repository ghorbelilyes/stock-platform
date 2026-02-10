package com.inventory.orchestrator.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Immutable audit log entity for tracking all security-relevant operations.
 * This entity should never be updated or deleted once created.
 */
@Entity
@Table(name = "audit_log", indexes = {
    @Index(name = "idx_audit_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_entity_type", columnList = "entity_type"),
    @Index(name = "idx_audit_created_at", columnList = "created_at")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 255)
    private String userId; // JWT sub claim

    @Column(name = "username", length = 255)
    private String username; // preferred_username from JWT

    @Column(name = "roles", length = 500)
    private String roles; // Comma-separated roles from JWT

    @Column(name = "action", nullable = false, length = 100)
    private String action; // e.g., "FILE_UPLOAD", "TRANSFER_APPROVE", "LOGIN", "LOGOUT"

    @Column(name = "entity_type", length = 100)
    private String entityType; // e.g., "FileUpload", "Transfer", "Stock"

    @Column(name = "entity_id")
    private Long entityId; // ID of the affected entity

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue; // JSON representation of old state

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue; // JSON representation of new state

    @Column(name = "ip_address", length = 45)
    private String ipAddress; // IPv4 or IPv6

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // Constructors
    public AuditLog() {
    }

    public AuditLog(String userId, String username, String roles, String action, 
                   String entityType, Long entityId, String oldValue, String newValue,
                   String ipAddress, String userAgent) {
        this.userId = userId;
        this.username = username;
        this.roles = roles;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = LocalDateTime.now();
    }

    // Getters (no setters to maintain immutability)
    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getRoles() {
        return roles;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public String getOldValue() {
        return oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
