# Keycloak Integration Guide

This document describes how to set up and configure Keycloak for the Intelligent Inventory Orchestrator backend.

## Overview

The backend uses Keycloak as the single source of truth for authentication and authorization. All users are managed in Keycloak, and the backend validates JWT tokens issued by Keycloak.

## Keycloak Realm Configuration

### ✅ Automated Setup (No UI): Realm Import JSON

This repo includes a ready-to-import realm file:

- `backend/keycloak/realm-inventory-orchestrator.json`

It provisions:
- Realm: `inventory-orchestrator`
- Realm roles: `ADMIN`, `MANAGER`, `USER`
- Client (public): `inventory-orchestrator-backend` with redirects for `http://localhost:4200/*`
- Test users: `admin` / `manager` / `user` with passwords and realm roles
- A client-scope mapper that ensures `realm_access.roles` is present in tokens

#### Option A (recommended): Docker Compose import on startup (idempotent)

The root `docker-compose.keycloak.yml` is configured to mount `backend/keycloak` into
`/opt/keycloak/data/import` and run:

`start-dev --import-realm`

Start Keycloak:

```bash
docker compose -f docker-compose.keycloak.yml up -d
```

If the realm already exists, Keycloak will skip importing it.

#### Option B: Manual import on startup (without Compose)

Place the JSON in `/opt/keycloak/data/import/` and start Keycloak with:

```bash
bin/kc.sh start-dev --import-realm
```

## Backend Configuration

### application.properties

The backend is configured to connect to Keycloak via these properties:

```properties
# Keycloak OAuth2 Resource Server Configuration
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8180/realms/inventory-orchestrator
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/certs

# Keycloak Admin Client Configuration (optional, for user management)
keycloak.server-url=http://localhost:8180
keycloak.realm=inventory-orchestrator
keycloak.client-id=inventory-orchestrator-backend
keycloak.client-secret=
keycloak.admin-realm=master
keycloak.admin-client-id=admin-cli
keycloak.admin-client-secret=
keycloak.admin-username=admin
keycloak.admin-password=admin
```

### Environment Variables

For production, use environment variables:

```bash
export KEYCLOAK_ISSUER_URI=http://keycloak:8180/realms/inventory-orchestrator
export KEYCLOAK_SERVER_URL=http://keycloak:8180
export KEYCLOAK_REALM=inventory-orchestrator
export KEYCLOAK_ADMIN_USERNAME=admin
export KEYCLOAK_ADMIN_PASSWORD=your-admin-password
```

## Role Mapping

The backend maps Keycloak roles to Spring Security roles:

| Keycloak Role | Spring Security Role | Access Level |
|---------------|---------------------|--------------|
| `ADMIN` | `ROLE_ADMIN` | All endpoints |
| `MANAGER` | `ROLE_MANAGER` | Transfers, Stocks, Sales (read-only) |
| `USER` | `ROLE_USER` | Products, Transfer Suggestions (read-only) |

## JWT Token Structure

The backend expects JWT tokens with the following structure:

```json
{
  "sub": "user-id-uuid",
  "preferred_username": "john.doe",
  "realm_access": {
    "roles": ["ADMIN", "MANAGER", "USER"]
  }
}
```

## Endpoint Protection

### Admin Only (`ROLE_ADMIN`)
- `POST /api/files/**` - All file upload operations
- `POST /api/transfers/suggestions/approve` - Approve transfer suggestions
- `GET /api/admin/audit-logs/**` - Query audit logs
- `GET /api/admin/users/**` - User management

### Admin + Manager (`ROLE_ADMIN` or `ROLE_MANAGER`)
- `GET /api/transfers/**` - View transfers
- `GET /api/stocks/**` - View stock levels
- `GET /api/sales/**` - View sales data

### All Authenticated Users
- `GET /api/products/**` - View products
- `GET /api/transfers/suggestions` - View transfer suggestions (read-only)

## Testing

### 1. Get Access Token

Using Keycloak's token endpoint:

```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password"
```

### 2. Use Token in API Calls

```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8080/api/products
```

## Running Keycloak

### Option 1: Docker Compose (Recommended for Quick Start)

A `docker-compose.keycloak.yml` file is provided in the project root.

**Start Keycloak:**
```bash
docker-compose -f docker-compose.keycloak.yml up -d
```

**Stop Keycloak:**
```bash
docker-compose -f docker-compose.keycloak.yml down
```

**View Logs:**
```bash
docker-compose -f docker-compose.keycloak.yml logs -f
```

**Access Admin Console:**
- URL: `http://localhost:8180`
- Username: `admin`
- Password: `admin`

### Option 2: Manual Installation (Without Docker)

For running Keycloak manually on your system:

**Quick Start:**
```bash
# Download
wget https://github.com/keycloak/keycloak/releases/download/25.0.0/keycloak-25.0.0.tar.gz
tar -xzf keycloak-25.0.0.tar.gz
cd keycloak-25.0.0

# Build
bin/kc.sh build

# Start (development mode)
bin/kc.sh start-dev --http-port=8180
```

**For complete manual installation guide, see `KEYCLOAK_MANUAL_INSTALL.md`**

### Option 3: Simple Docker Run (Development)

```bash
docker run -d \
  --name keycloak \
  -p 8180:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:25.0.0 \
  start-dev
```

**For detailed running and management instructions, see `KEYCLOAK_RUNNING_GUIDE.md`**

## Troubleshooting

### Token Validation Fails

1. Verify `issuer-uri` matches Keycloak realm URL
2. Check that JWT contains `realm_access.roles`
3. Ensure roles are assigned to the user in Keycloak

### 401 Unauthorized

- Verify token is included in `Authorization: Bearer <token>` header
- Check token expiration
- Verify user has required roles

### 403 Forbidden

- User is authenticated but lacks required role
- Check user's role assignments in Keycloak
- Verify role mapping in `KeycloakJwtAuthenticationConverter`

## Security Notes

- **Never commit** Keycloak admin credentials to version control
- Use environment variables for production
- Enable HTTPS in production
- Regularly rotate admin passwords
- Monitor audit logs for suspicious activity
