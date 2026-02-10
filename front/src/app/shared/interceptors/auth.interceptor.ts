import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from '../services/keycloak.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const keycloakService = inject(KeycloakService);

    // Skip adding token for Keycloak endpoints
    if (req.url.includes('keycloak') || req.url.includes('localhost:8180')) {
        return next(req);
    }

    // Get token
    const token = keycloakService.getToken();

    // Add token to request if available
    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    return next(req);
};
