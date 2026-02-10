# Keycloak Running and Management Guide

This guide provides step-by-step instructions for running and managing Keycloak for the Intelligent Inventory Orchestrator.

## Quick Start: Running Keycloak with Docker

### Option 1: Docker Compose (Recommended)

Create a `docker-compose.keycloak.yml` file in your project root:

```yaml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:25.0.0
    container_name: keycloak
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
    ports:
      - "8180:8080"
    command: start-dev
    depends_on:
      - keycloak-db
    networks:
      - keycloak-network

  keycloak-db:
    image: postgres:15-alpine
    container_name: keycloak-db
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - keycloak-db-data:/var/lib/postgresql/data
    networks:
      - keycloak-network

volumes:
  keycloak-db-data:

networks:
  keycloak-network:
    driver: bridge
```

**Run Keycloak:**
```bash
docker-compose -f docker-compose.keycloak.yml up -d
```

**Stop Keycloak:**
```bash
docker-compose -f docker-compose.keycloak.yml down
```

**View Logs:**
```bash
docker-compose -f docker-compose.keycloak.yml logs -f keycloak
```

### Option 2: Simple Docker Run (Development Only)

For quick testing without a database:

```bash
docker run -d \
  --name keycloak \
  -p 8180:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:25.0.0 \
  start-dev
```

**Note:** This uses an in-memory H2 database (data is lost when container stops).

### Option 3: Standalone Installation

1. **Download Keycloak:**
   ```bash
   wget https://github.com/keycloak/keycloak/releases/download/25.0.0/keycloak-25.0.0.tar.gz
   tar -xzf keycloak-25.0.0.tar.gz
   cd keycloak-25.0.0
   ```

2. **Create Admin User:**
   ```bash
   bin/kc.sh build
   bin/kc.sh start-dev --http-port=8180
   ```

3. **Access Admin Console:**
   - URL: `http://localhost:8180`
   - Username: `admin`
   - Password: (set during first run)

## Accessing Keycloak Admin Console

1. **Open Browser:**
   Navigate to: `http://localhost:8180`

2. **Login:**
   - Click **Administration Console**
   - Username: `admin`
   - Password: `admin` (or your configured password)

3. **Admin Console Overview:**
   - **Realm Settings**: Configure realms, themes, security
   - **Clients**: Manage OAuth2/OIDC clients
   - **Users**: Manage users and their credentials
   - **Roles**: Define realm and client roles
   - **Groups**: Organize users into groups
   - **Sessions**: View active user sessions

## Step-by-Step Setup for Inventory Orchestrator

### Step 1: Create Realm

1. In Admin Console, hover over the realm dropdown (top-left, shows "master")
2. Click **Create Realm**
3. Enter realm name: `inventory-orchestrator`
4. Click **Create**

### Step 2: Create Roles

1. Go to **Realm Settings** → **Roles** → **Realm roles**
2. Click **Create role** button
3. Create each role:
   - **Role name**: `ADMIN` → Click **Save**
   - **Role name**: `MANAGER` → Click **Save**
   - **Role name**: `USER` → Click **Save**

### Step 3: Create Client

1. Go to **Clients** → Click **Create client**
2. **General Settings:**
   - **Client type**: `OpenID Connect`
   - **Client ID**: `inventory-orchestrator-backend`
   - Click **Next**

3. **Capability config:**
   - **Client authentication**: `Off` (Public client)
   - **Authorization**: `Off`
   - **Authentication flow**: `Standard flow` ✅
   - **Direct access grants**: ✅ (Enable for testing)
   - Click **Next**

4. **Login settings:**
   - **Root URL**: (leave empty)
   - **Home URL**: (leave empty)
   - **Valid redirect URIs**: 
     - `http://localhost:4200/*`
     - `http://localhost:4200`
   - **Valid post logout redirect URIs**: 
     - `http://localhost:4200/*`
   - **Web origins**: 
     - `http://localhost:4200`
   - Click **Save**

### Step 4: Configure Client Mappers (Add Roles to JWT)

1. Go to **Clients** → `inventory-orchestrator-backend` → **Mappers** tab
2. Click **Create mapper**
3. Select **By configuration** → **User Realm Role**
4. Configure:
   - **Name**: `realm-roles`
   - **Token Claim Name**: `realm_access.roles`
   - **Add to access token**: `ON` ✅
   - **Add to ID token**: `ON` ✅
   - **Add to userinfo**: `ON` ✅
   - Click **Save**

### Step 5: Create Test Users

#### Create Admin User

1. Go to **Users** → Click **Create new user**
2. **Details:**
   - **Username**: `admin`
   - **Email**: `admin@example.com`
   - **First name**: `Admin`
   - **Last name**: `User`
   - **Email verified**: ✅ (toggle ON)
   - **Enabled**: ✅ (toggle ON)
   - Click **Create**

3. **Set Password:**
   - Go to **Credentials** tab
   - Click **Set password**
   - **Password**: `admin123` (or your choice)
   - **Temporary**: `OFF` (uncheck)
   - Click **Save**
   - Confirm password

4. **Assign Role:**
   - Go to **Role mapping** tab
   - Click **Assign role**
   - Filter: `ADMIN`
   - Select `ADMIN` role
   - Click **Assign**

#### Create Manager User

1. **Create User:**
   - Username: `manager`
   - Email: `manager@example.com`
   - First name: `Manager`
   - Last name: `User`
   - Enabled: ✅

2. **Set Password:**
   - Password: `manager123`
   - Temporary: `OFF`

3. **Assign Role:**
   - Assign `MANAGER` role

#### Create Regular User

1. **Create User:**
   - Username: `user`
   - Email: `user@example.com`
   - First name: `Regular`
   - Last name: `User`
   - Enabled: ✅

2. **Set Password:**
   - Password: `user123`
   - Temporary: `OFF`

3. **Assign Role:**
   - Assign `USER` role

## Managing Keycloak

### Viewing Users

1. Go to **Users** → Browse/search users
2. Click on a user to view/edit details
3. **Tabs:**
   - **Details**: Edit user info
   - **Credentials**: Change password
   - **Role mapping**: Assign/remove roles
   - **Groups**: Add to groups
   - **Sessions**: View active sessions
   - **Attributes**: Custom attributes

### Assigning Roles to Users

1. Go to **Users** → Select user
2. Click **Role mapping** tab
3. Click **Assign role**
4. Filter by role name or select from list
5. Check desired roles
6. Click **Assign**

### Enabling/Disabling Users

1. Go to **Users** → Select user
2. Toggle **Enabled** switch
3. Click **Save**

### Resetting User Password

1. Go to **Users** → Select user
2. Click **Credentials** tab
3. Click **Set password**
4. Enter new password
5. **Temporary**: Check if user must change on next login
6. Click **Save**

### Viewing Active Sessions

1. Go to **Users** → Select user
2. Click **Sessions** tab
3. View active sessions
4. Click **Logout all sessions** to force logout

### Client Configuration

1. Go to **Clients** → Select client
2. **Settings tab**: General configuration
3. **Credentials tab**: Client secrets (for confidential clients)
4. **Roles tab**: Client-specific roles
5. **Mappers tab**: Token claim mappers
6. **Advanced tab**: Advanced settings

### Realm Settings

1. Go to **Realm Settings**
2. **General**: Realm name, display name
3. **Login**: Login settings, themes
4. **Email**: Email server configuration
5. **Themes**: Custom themes
6. **Security**: Security policies
7. **Sessions**: Session timeout settings

## Testing Authentication

### Get Access Token via cURL

```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "...",
  "token_type": "Bearer",
  "not-before-policy": 0,
  "session_state": "...",
  "scope": "profile email"
}
```

### Test API with Token

```bash
# Extract access_token from response
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test API call
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/products
```

### Decode JWT Token (Verify Roles)

Use [jwt.io](https://jwt.io) to decode the token and verify:
- `sub`: User ID
- `preferred_username`: Username
- `realm_access.roles`: Should contain `["ADMIN"]` for admin user

## Common Management Tasks

### Export Realm Configuration

1. Go to **Realm Settings** → **Action** dropdown
2. Click **Export**
3. Choose export format (JSON)
4. Download file

### Import Realm Configuration

1. Go to **Realm Settings** → **Action** dropdown
2. Click **Import**
3. Select JSON file
4. Configure import options
5. Click **Import**

### Backup Keycloak Data

**If using PostgreSQL:**
```bash
# Backup database
docker exec keycloak-db pg_dump -U keycloak keycloak > keycloak-backup.sql

# Restore
docker exec -i keycloak-db psql -U keycloak keycloak < keycloak-backup.sql
```

### View Keycloak Logs

**Docker:**
```bash
docker logs keycloak
docker logs -f keycloak  # Follow logs
```

**Standalone:**
```bash
tail -f keycloak-25.0.0/data/log/keycloak.log
```

## Troubleshooting

### Keycloak Won't Start

1. **Check ports:**
   ```bash
   # Check if port 8180 is in use
   lsof -i :8180
   # Or
   netstat -an | grep 8180
   ```

2. **Check logs:**
   ```bash
   docker logs keycloak
   ```

3. **Verify environment variables:**
   ```bash
   docker exec keycloak env | grep KEYCLOAK
   ```

### Can't Login to Admin Console

1. Verify admin credentials
2. Check if user is enabled
3. Clear browser cache/cookies
4. Try incognito/private mode

### Token Validation Fails

1. **Verify realm name matches:**
   - Backend config: `inventory-orchestrator`
   - Keycloak realm: `inventory-orchestrator`

2. **Check issuer URI:**
   ```bash
   # Should return realm info
   curl http://localhost:8180/realms/inventory-orchestrator
   ```

3. **Verify JWK endpoint:**
   ```bash
   # Should return public keys
   curl http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/certs
   ```

### Roles Not in Token

1. Verify roles are assigned to user
2. Check client mapper is configured correctly
3. Verify mapper is enabled for access token
4. Try logging out and logging back in

## Production Considerations

### Use PostgreSQL (Not H2)

The `start-dev` command uses H2 (in-memory). For production:

```yaml
command: start \
  --db=postgres \
  --db-url=jdbc:postgresql://keycloak-db:5432/keycloak \
  --db-username=keycloak \
  --db-password=keycloak \
  --hostname=your-domain.com \
  --https-port=8443
```

### Enable HTTPS

1. Configure reverse proxy (nginx/traefik)
2. Set `KC_HOSTNAME_STRICT_HTTPS=true`
3. Use SSL certificates

### Set Strong Admin Password

```bash
export KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)
```

### Regular Backups

Set up automated backups of PostgreSQL database.

## Quick Reference Commands

```bash
# Start Keycloak
docker-compose -f docker-compose.keycloak.yml up -d

# Stop Keycloak
docker-compose -f docker-compose.keycloak.yml down

# Restart Keycloak
docker-compose -f docker-compose.keycloak.yml restart

# View logs
docker-compose -f docker-compose.keycloak.yml logs -f

# Access Keycloak shell
docker exec -it keycloak /bin/bash

# Backup database
docker exec keycloak-db pg_dump -U keycloak keycloak > backup.sql

# Get access token
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

## Next Steps

After setting up Keycloak:

1. ✅ Create realm: `inventory-orchestrator`
2. ✅ Create roles: `ADMIN`, `MANAGER`, `USER`
3. ✅ Create client: `inventory-orchestrator-backend`
4. ✅ Configure client mapper for roles
5. ✅ Create test users with roles
6. ✅ Test authentication with backend
7. ✅ Configure frontend to use Keycloak

For frontend integration, see the Angular Keycloak integration guide.
