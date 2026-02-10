import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';

/**
 * Guard for login page - redirects to home if already authenticated
 */
export const loginGuard: CanActivateFn = (route, state) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    // If already authenticated, redirect to home
    if (keycloakService.isAuthenticated()) {
        const returnUrl = route.queryParams['returnUrl'] || '/';
        router.navigate([returnUrl]);
        return false;
    }

    return true;
};
