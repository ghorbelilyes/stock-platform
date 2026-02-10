import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { keycloakConfig, keycloakInitOptions } from '../config/keycloak.config';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class KeycloakService {
    private keycloak: Keycloak | undefined;
    private authenticated$ = new BehaviorSubject<boolean>(false);
    private roles$ = new BehaviorSubject<string[]>([]);
    private username$ = new BehaviorSubject<string | null>(null);
    private initialized$ = new BehaviorSubject<boolean>(false);

    constructor(private router: Router) { }

    /**
     * Initialize Keycloak
     */
    async init(): Promise<boolean> {
        try {
            this.keycloak = new Keycloak(keycloakConfig);

            const authenticated = await this.keycloak.init(keycloakInitOptions);
            console.log('Keycloak init result:', authenticated);

            if (authenticated) {
                this.updateUserInfo();
            } else {
                // Not authenticated, clear user info
                this.roles$.next([]);
                this.username$.next(null);
            }

            this.authenticated$.next(authenticated);
            this.initialized$.next(true);

            // Listen for auth success
            this.keycloak.onAuthSuccess = () => {
                this.updateUserInfo();
                this.authenticated$.next(true);
            };

            // Listen for auth error
            this.keycloak.onAuthError = () => {
                this.authenticated$.next(false);
                this.roles$.next([]);
                this.username$.next(null);
            };

            // Listen for token refresh
            this.keycloak.onTokenExpired = () => {
                this.keycloak?.updateToken(30).then((refreshed: boolean) => {
                    if (refreshed) {
                        console.log('Token refreshed');
                    }
                }).catch(() => {
                    console.error('Failed to refresh token');
                    this.logout();
                });
            };

            return authenticated;
        } catch (error) {
            console.error('Keycloak initialization failed:', error);
            // Check for potential CORS or Network issues
            if (error instanceof Error && (error.message.includes('Network') || error.message.includes('CORS'))) {
                console.error('Possible CORS issue. Please check "Web Origins" in Keycloak for client "inventory-orchestrator-backend". It should be set to "+" or "http://localhost:4200".');
            }
            this.authenticated$.next(false);
            this.initialized$.next(true); // Still mark as initialized to unblock guard
            return false;
        }
    }

    /**
     * Wait for initialization to complete
     */
    waitForInitialization(): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.initialized$.value) {
                resolve(true);
            } else {
                const sub = this.initialized$.subscribe(initialized => {
                    if (initialized) {
                        sub.unsubscribe();
                        resolve(true);
                    }
                });
            }
        });
    }

    /**
     * Login with Keycloak
     */
    login(): void {
        this.keycloak?.login({
            redirectUri: window.location.origin
        });
    }

    /**
     * Logout
     */
    logout(): void {
        this.keycloak?.logout({
            redirectUri: window.location.origin + '/auth/login'
        });
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.keycloak?.authenticated ?? false;
    }

    /**
     * Get authentication status as observable
     */
    getAuthenticated(): Observable<boolean> {
        return this.authenticated$.asObservable();
    }

    /**
     * Get access token
     */
    getToken(): string | undefined {
        return this.keycloak?.token;
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | undefined {
        return this.keycloak?.refreshToken;
    }

    /**
     * Update token if needed
     */
    async updateToken(minValidity: number = 5): Promise<boolean> {
        try {
            if (this.keycloak?.isTokenExpired(minValidity)) {
                return await this.keycloak.updateToken(minValidity);
            }
            return true;
        } catch (error) {
            console.error('Failed to update token:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Check if user has role
     */
    hasRole(role: string): boolean {
        if (!this.keycloak?.authenticated) {
            return false;
        }
        return this.keycloak.hasRealmRole(role);
    }

    /**
     * Check if user has any of the roles
     */
    hasAnyRole(roles: string[]): boolean {
        return roles.some(role => this.hasRole(role));
    }

    /**
     * Get user roles
     */
    getRoles(): string[] {
        if (!this.keycloak?.authenticated) {
            return [];
        }
        return this.keycloak.realmAccess?.roles || [];
    }

    /**
     * Get roles as observable
     */
    getRolesObservable(): Observable<string[]> {
        return this.roles$.asObservable();
    }

    /**
     * Get username
     */
    getUsername(): string | null {
        return this.keycloak?.tokenParsed?.['preferred_username'] || null;
    }

    /**
     * Get username as observable
     */
    getUsernameObservable(): Observable<string | null> {
        return this.username$.asObservable();
    }

    /**
     * Get user ID
     */
    getUserId(): string | null {
        return this.keycloak?.tokenParsed?.['sub'] || null;
    }

    /**
     * Update user info from token
     */
    private updateUserInfo(): void {
        if (this.keycloak?.authenticated) {
            const roles = this.getRoles();
            const username = this.getUsername();
            this.roles$.next(roles);
            this.username$.next(username);
        }
    }

    /**
     * Get Keycloak instance (for advanced usage)
     */
    getKeycloakInstance(): Keycloak | undefined {
        return this.keycloak;
    }
}
