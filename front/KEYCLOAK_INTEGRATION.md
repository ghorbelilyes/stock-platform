# Keycloak Frontend Integration Guide

## Overview

The Angular frontend has been integrated with Keycloak for authentication and authorization. Users must login through Keycloak to access the application.

## What Was Implemented

### 1. Keycloak Service (`src/app/shared/services/keycloak.service.ts`)
- Handles Keycloak initialization
- Manages authentication state
- Provides methods for login/logout
- Exposes user roles and username
- Handles token refresh automatically

### 2. HTTP Interceptor (`src/app/shared/interceptors/auth.interceptor.ts`)
- Automatically adds Bearer token to all API requests
- Skips Keycloak endpoints

### 3. Route Guards
- **Auth Guard** (`src/app/shared/guards/auth.guard.ts`): Requires authentication
- **Role Guards** (`src/app/shared/guards/role.guard.ts`): Requires specific roles
  - `roleGuard('ADMIN')`: Requires ADMIN role
  - `anyRoleGuard(['ADMIN', 'MANAGER'])`: Requires any of the specified roles

### 4. Login Component
- Updated to use Keycloak login
- Redirects to Keycloak login page
- Handles return URL after login

### 5. Protected Routes

#### Admin Only:
- `/inventory/upload` - File upload
- `/inventory/update-stock` - Update stock
- `/inventory/settings` - Settings

#### Admin + Manager:
- `/inventory/stock` - Stock management
- `/inventory/sales` - Sales data
- `/inventory/transfers` - Transfers
- `/inventory/stores` - Stores
- `/inventory/reports` - Reports

#### All Authenticated Users:
- `/inventory/products` - Products
- `/inventory/categories` - Categories
- `/` - Dashboard

### 6. Topbar Integration
- Shows username when logged in
- Logout button

## Configuration

### Keycloak Config (`src/app/shared/config/keycloak.config.ts`)

```typescript
export const keycloakConfig = {
    url: 'http://localhost:8180',
    realm: 'inventory-orchestrator',
    clientId: 'inventory-orchestrator-backend'
};
```

**For production**, update these values to match your Keycloak server.

## Installation

1. **Install dependencies:**
   ```bash
   cd front
   npm install
   ```

2. **Start Keycloak** (if not already running):
   ```bash
   docker-compose -f docker-compose.keycloak.yml up -d
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

## Usage

### Login Flow

1. User navigates to any protected route
2. If not authenticated, redirected to `/auth/login`
3. Click "Sign In with Keycloak"
4. Redirected to Keycloak login page
5. After successful login, redirected back to the app

### Test Users

- **Admin**: `admin` / `admin123` (ADMIN role)
- **Manager**: `manager` / `manager123` (MANAGER role)
- **User**: `user` / `user123` (USER role)

### Checking User Roles

```typescript
import { KeycloakService } from './shared/services/keycloak.service';

constructor(private keycloakService: KeycloakService) {}

// Check if user has role
if (this.keycloakService.hasRole('ADMIN')) {
    // Admin only code
}

// Check if user has any of the roles
if (this.keycloakService.hasAnyRole(['ADMIN', 'MANAGER'])) {
    // Admin or Manager code
}

// Get all roles
const roles = this.keycloakService.getRoles();

// Get username
const username = this.keycloakService.getUsername();
```

### Observing Authentication State

```typescript
// Subscribe to authentication state
this.keycloakService.getAuthenticated().subscribe(isAuthenticated => {
    if (isAuthenticated) {
        // User is logged in
    }
});

// Subscribe to username changes
this.keycloakService.getUsernameObservable().subscribe(username => {
    console.log('Username:', username);
});

// Subscribe to role changes
this.keycloakService.getRolesObservable().subscribe(roles => {
    console.log('Roles:', roles);
});
```

## Troubleshooting

### 1. CORS Errors

If you see CORS errors, ensure Keycloak client has the correct redirect URIs:
- `http://localhost:4200/*` (development)
- Your production URL (production)

### 2. Token Not Attached

Check browser console for errors. The HTTP interceptor should automatically attach tokens.

### 3. 401 Unauthorized

- Token might be expired (should auto-refresh)
- User might not be authenticated
- Check Keycloak is running

### 4. 403 Forbidden

- User doesn't have required role
- Check user roles in Keycloak Admin Console

### 5. Login Redirect Loop

- Check Keycloak client configuration
- Ensure redirect URIs are correct
- Check browser console for errors

## Production Deployment

1. **Update Keycloak Config:**
   ```typescript
   export const keycloakConfig = {
       url: 'https://your-keycloak-server.com',
       realm: 'inventory-orchestrator',
       clientId: 'inventory-orchestrator-backend'
   };
   ```

2. **Update Client in Keycloak:**
   - Add production redirect URIs
   - Update Web Origins

3. **Build for Production:**
   ```bash
   npm run build
   ```

## Security Notes

- Tokens are stored in memory (not localStorage)
- Tokens automatically refresh before expiration
- All API requests include Bearer token
- Routes are protected by guards
- Role-based access control enforced
