import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    // Wait a bit for Keycloak to initialize if needed
    console.log('AuthGuard: Waiting for Keycloak initialization...');
    await keycloakService.waitForInitialization();

    // Check authentication status
    const isAuthenticated = keycloakService.isAuthenticated();
    console.log('AuthGuard: Checking auth status', { isAuthenticated, url: state.url });

    if (isAuthenticated) {
        return true;
    }

    // Not authenticated, redirect to login
    router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });
    return false;
};
