package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.AuditLog;
import com.inventory.orchestrator.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Admin-only controller for querying audit logs.
 */
@RestController
@RequestMapping("/admin/audit-logs")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AdminAuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Get audit logs with optional filters.
     * 
     * Query parameters:
     * - userId: Filter by user ID (JWT sub)
     * - action: Filter by action (e.g., "FILE_UPLOAD", "TRANSFER_APPROVE")
     * - entityType: Filter by entity type (e.g., "FileUpload", "Transfer")
     * - from: Start date (ISO format: yyyy-MM-ddTHH:mm:ss)
     * - to: End date (ISO format: yyyy-MM-ddTHH:mm:ss)
     * - page: Page number (0-indexed, default: 0)
     * - size: Page size (default: 20, max: 100)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
        @RequestParam(required = false) String userId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) String entityType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        // Validate pagination
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;

        Pageable pageable = PageRequest.of(page, size);

        Page<AuditLog> auditLogs = auditLogRepository.findWithFilters(
            userId,
            action,
            entityType,
            from,
            to,
            pageable
        );

        return ResponseEntity.ok(ApiResponse.success(auditLogs, "Audit logs retrieved successfully"));
    }

    /**
     * Get audit log by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuditLog>> getAuditLogById(@PathVariable Long id) {
        return auditLogRepository.findById(id)
            .map(auditLog -> ResponseEntity.ok(ApiResponse.success(auditLog, "Audit log retrieved successfully")))
            .orElse(ResponseEntity.notFound().build());
    }
}
