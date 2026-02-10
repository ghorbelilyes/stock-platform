package com.inventory.orchestrator.security;

import com.inventory.orchestrator.service.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to automatically log login/logout events and other security-relevant operations.
 * This filter runs after authentication but before controller methods.
 */
public class AuditLoggingFilter extends OncePerRequestFilter {

    private final AuditService auditService;

    public AuditLoggingFilter(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        Authentication previousAuth = SecurityContextHolder.getContext().getAuthentication();
        
        // Continue with the filter chain
        filterChain.doFilter(request, response);
        
        // After authentication, check if this is a login/logout event
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        
        // Log login: authentication changed from null/anonymous to authenticated
        if (previousAuth == null || !previousAuth.isAuthenticated()) {
            if (currentAuth != null && currentAuth.isAuthenticated() && currentAuth.getPrincipal() instanceof Jwt) {
                // This is a login event
                auditService.logLogin();
            }
        }
        
        // Note: Logout is typically handled by the frontend or session invalidation,
        // but we can detect it if needed. For stateless JWT, logout is implicit.
    }
}
