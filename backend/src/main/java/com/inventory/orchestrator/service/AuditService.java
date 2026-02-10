package com.inventory.orchestrator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.orchestrator.entity.AuditLog;
import com.inventory.orchestrator.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.stream.Collectors;

/**
 * Service for creating audit log entries.
 * Audit failures must not break business logic, so all methods are wrapped in try-catch.
 */
@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);
    
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Log an audit event. This method never throws exceptions to avoid breaking business logic.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(String action, String entityType, Long entityId, Object oldValue, Object newValue) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
                logger.debug("No authentication context available for audit logging");
                return;
            }

            Jwt jwt = (Jwt) authentication.getPrincipal();
            String userId = jwt.getSubject();
            String username = jwt.getClaimAsString("preferred_username");
            String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(", "));

            HttpServletRequest request = getCurrentRequest();
            String ipAddress = extractIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldValueJson = serializeValue(oldValue);
            String newValueJson = serializeValue(newValue);

            AuditLog auditLog = new AuditLog(
                userId,
                username,
                roles,
                action,
                entityType,
                entityId,
                oldValueJson,
                newValueJson,
                ipAddress,
                userAgent
            );

            auditLogRepository.save(auditLog);
            logger.debug("Audit log created: action={}, userId={}, entityType={}, entityId={}", 
                action, userId, entityType, entityId);
        } catch (Exception e) {
            // Audit failures must not break business logic
            logger.error("Failed to create audit log: action={}, error={}", action, e.getMessage(), e);
        }
    }

    /**
     * Log a simple audit event without entity details
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(String action) {
        logAudit(action, null, null, null, null);
    }

    /**
     * Log login event
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogin() {
        logAudit("LOGIN");
    }

    /**
     * Log logout event
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogout() {
        logAudit("LOGOUT");
    }

    /**
     * Serialize object to JSON string
     */
    private String serializeValue(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            logger.warn("Failed to serialize value for audit log: {}", e.getMessage());
            return value.toString();
        }
    }

    /**
     * Extract IP address from request, handling proxies
     */
    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in the chain
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Get current HTTP request from Spring context
     */
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = 
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            logger.debug("Could not get current request: {}", e.getMessage());
            return null;
        }
    }
}
