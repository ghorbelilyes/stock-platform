import { KeycloakInitOptions } from 'keycloak-js';

export const keycloakConfig = {
    url: 'http://localhost:8180',
    realm: 'inventory-orchestrator',
    clientId: 'inventory-orchestrator-backend'
    // IMPORTANT: In Keycloak Admin Console -> Clients -> inventory-orchestrator-backend
    // Ensure "Web Origins" is set to "+" or "http://localhost:4200" to avoid CORS errors.
};

export const keycloakInitOptions: KeycloakInitOptions = {
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    enableLogging: true
};
