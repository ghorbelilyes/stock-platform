import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';

/**
 * Guard that requires user to have specific role
 */
export const roleGuard = (requiredRole: string): CanActivateFn => {
    return (route, state) => {
        const keycloakService = inject(KeycloakService);
        const router = inject(Router);

        if (!keycloakService.isAuthenticated()) {
            router.navigate(['/auth/login'], { 
                queryParams: { returnUrl: state.url } 
            });
            return false;
        }

        if (keycloakService.hasRole(requiredRole)) {
            return true;
        }

        // User doesn't have required role
        router.navigate(['/auth/access']);
        return false;
    };
};

/**
 * Guard that requires user to have any of the specified roles
 */
export const anyRoleGuard = (roles: string[]): CanActivateFn => {
    return (route, state) => {
        const keycloakService = inject(KeycloakService);
        const router = inject(Router);

        if (!keycloakService.isAuthenticated()) {
            router.navigate(['/auth/login'], { 
                queryParams: { returnUrl: state.url } 
            });
            return false;
        }

        if (keycloakService.hasAnyRole(roles)) {
            return true;
        }

        // User doesn't have any of the required roles
        router.navigate(['/auth/access']);
        return false;
    };
};
