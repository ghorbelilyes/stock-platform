# Keycloak Quick Setup Checklist

This is a step-by-step checklist of everything you need to create in Keycloak for the Inventory Orchestrator backend.

## Prerequisites

- Keycloak running at `http://localhost:8180`
- Admin access to Keycloak Admin Console

## Step-by-Step Setup

### ✅ Step 1: Create Realm

1. Open Keycloak Admin Console: `http://localhost:8180`
2. Login with admin credentials
3. Hover over the realm dropdown (top-left, shows "master")
4. Click **"Create Realm"**
5. **Realm name**: `inventory-orchestrator`
6. Click **"Create"**

**Result**: You now have a new realm called `inventory-orchestrator`

---

### ✅ Step 2: Create Roles

1. In the left sidebar, go to **"Realm settings"** → **"Roles"** tab
2. Click **"Realm roles"** tab (if not already selected)
3. Click **"Create role"** button (top-right)

**Create these 3 roles:**

#### Role 1: ADMIN
- **Role name**: `ADMIN`
- Click **"Save"**

#### Role 2: MANAGER
- Click **"Create role"** again
- **Role name**: `MANAGER`
- Click **"Save"**

#### Role 3: USER
- Click **"Create role"** again
- **Role name**: `USER`
- Click **"Save"**

**Result**: You have 3 realm roles: `ADMIN`, `MANAGER`, `USER`

---

### ✅ Step 3: Create Client

1. In the left sidebar, go to **"Clients"**
2. Click **"Create client"** button (top-right)

#### General Settings
- **Client type**: Select `OpenID Connect`
- **Client ID**: `inventory-orchestrator-backend`
- Click **"Next"**

#### Capability config
- **Client authentication**: `Off` (Public client)
- **Authorization**: `Off` (unchecked)
- **Authentication flow**: 
  - ✅ **Standard flow** (checked)
  - ✅ **Direct access grants** (checked) - for testing
- Click **"Next"**

#### Login settings
- **Root URL**: (leave empty)
- **Home URL**: (leave empty)
- **Valid redirect URIs**: 
  ```
  http://localhost:4200/*
  http://localhost:4200
  ```
- **Valid post logout redirect URIs**: 
  ```
  http://localhost:4200/*
  ```
- **Web origins**: 
  ```
  http://localhost:4200
  ```
- Click **"Save"**

**Result**: Client `inventory-orchestrator-backend` is created

---

### ✅ Step 4: Configure Client Mapper (Add Roles to JWT)

1. Go to **"Clients"** → Click on `inventory-orchestrator-backend`
2. Click **"Mappers"** tab
3. Click **"Create mapper"** button
4. Select **"By configuration"** dropdown → Select **"User Realm Role"**

#### Configure Mapper
- **Name**: `realm-roles`
- **Token Claim Name**: `realm_access.roles`
- **Add to access token**: ✅ **ON**
- **Add to ID token**: ✅ **ON**
- **Add to userinfo**: ✅ **ON**
- Click **"Save"**

**Result**: Roles will now be included in JWT tokens

---

### ✅ Step 5: Create Test Users

#### User 1: Admin User

1. Go to **"Users"** → Click **"Create new user"**
2. **Details tab**:
   - **Username**: `admin`
   - **Email**: `admin@example.com`
   - **First name**: `Admin`
   - **Last name**: `User`
   - **Email verified**: ✅ Toggle **ON**
   - **Enabled**: ✅ Toggle **ON**
   - Click **"Create"**

3. **Set Password**:
   - Click **"Credentials"** tab
   - Click **"Set password"**
   - **Password**: `admin123` (or your choice)
   - **Temporary**: ❌ **OFF** (unchecked)
   - Click **"Save"**
   - Click **"Save"** again to confirm

4. **Assign Role**:
   - Click **"Role mapping"** tab
   - Click **"Assign role"** button
   - In the filter/search box, type: `ADMIN`
   - Check the box next to `ADMIN` (realm role)
   - Click **"Assign"**

**Result**: Admin user created with ADMIN role

---

#### User 2: Manager User

1. **Create User**:
   - Go to **"Users"** → **"Create new user"**
   - **Username**: `manager`
   - **Email**: `manager@example.com`
   - **First name**: `Manager`
   - **Last name**: `User`
   - **Email verified**: ✅ ON
   - **Enabled**: ✅ ON
   - Click **"Create"**

2. **Set Password**:
   - **Credentials** tab → **"Set password"**
   - **Password**: `manager123`
   - **Temporary**: ❌ OFF
   - Click **"Save"** twice

3. **Assign Role**:
   - **Role mapping** tab → **"Assign role"**
   - Search: `MANAGER`
   - Select `MANAGER` role
   - Click **"Assign"**

**Result**: Manager user created with MANAGER role

---

#### User 3: Regular User

1. **Create User**:
   - Go to **"Users"** → **"Create new user"**
   - **Username**: `user`
   - **Email**: `user@example.com`
   - **First name**: `Regular`
   - **Last name**: `User`
   - **Email verified**: ✅ ON
   - **Enabled**: ✅ ON
   - Click **"Create"**

2. **Set Password**:
   - **Credentials** tab → **"Set password"**
   - **Password**: `user123`
   - **Temporary**: ❌ OFF
   - Click **"Save"** twice

3. **Assign Role**:
   - **Role mapping** tab → **"Assign role"**
   - Search: `USER`
   - Select `USER` role
   - Click **"Assign"**

**Result**: Regular user created with USER role

---

## Verification Checklist

After setup, verify everything:

### ✅ Realm Created
- [ ] Realm `inventory-orchestrator` exists
- [ ] You're currently viewing this realm (check top-left dropdown)

### ✅ Roles Created
- [ ] Go to **Realm settings** → **Roles** → **Realm roles**
- [ ] See 3 roles: `ADMIN`, `MANAGER`, `USER`

### ✅ Client Created
- [ ] Go to **Clients**
- [ ] See client: `inventory-orchestrator-backend`
- [ ] Client type: `OpenID Connect`
- [ ] Access type: `public`

### ✅ Client Mapper Configured
- [ ] Go to **Clients** → `inventory-orchestrator-backend` → **Mappers**
- [ ] See mapper: `realm-roles`
- [ ] Token claim name: `realm_access.roles`
- [ ] Add to access token: ✅ ON

### ✅ Users Created
- [ ] Go to **Users**
- [ ] See 3 users: `admin`, `manager`, `user`
- [ ] All users are **Enabled**
- [ ] All users have passwords set

### ✅ Roles Assigned
- [ ] `admin` user has `ADMIN` role
- [ ] `manager` user has `MANAGER` role
- [ ] `user` user has `USER` role

## Test Authentication

### Test Admin User

```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

**Expected**: Returns access_token

### Test Manager User

```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=manager" \
  -d "password=manager123" \
  -d "grant_type=password"
```

### Test Regular User

```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=user" \
  -d "password=user123" \
  -d "grant_type=password"
```

### Verify Token Contains Roles

1. Copy the `access_token` from the response
2. Go to https://jwt.io
3. Paste the token
4. Check the payload - you should see:
   ```json
   {
     "realm_access": {
       "roles": ["ADMIN"]  // or ["MANAGER"] or ["USER"]
     }
   }
   ```

## Quick Reference

### What You Created

1. ✅ **1 Realm**: `inventory-orchestrator`
2. ✅ **3 Roles**: `ADMIN`, `MANAGER`, `USER`
3. ✅ **1 Client**: `inventory-orchestrator-backend`
4. ✅ **1 Mapper**: `realm-roles` (adds roles to JWT)
5. ✅ **3 Users**: `admin`, `manager`, `user`

### Test Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `manager` | `manager123` | MANAGER |
| `user` | `user123` | USER |

## Troubleshooting

### Can't see realm dropdown
- Make sure you're logged in as admin
- Check URL shows `/admin/` path

### Can't create realm
- You must be in the `master` realm to create new realms
- Check you're logged in as admin

### Roles not in token
- Verify mapper is created and enabled
- Check "Add to access token" is ON
- Try logging out and back in
- Verify role is assigned to user

### User can't login
- Check user is **Enabled**
- Check password is set (not temporary)
- Check **Email verified** is ON
- Verify user is in correct realm

### Client not working
- Verify client ID matches: `inventory-orchestrator-backend`
- Check redirect URIs include your frontend URL
- Verify "Direct access grants" is enabled (for testing)

## Next Steps

After completing this setup:

1. ✅ Test authentication with backend
2. ✅ Configure frontend to use Keycloak
3. ✅ Test API endpoints with different user roles
4. ✅ Verify permissions work correctly

## Summary

**Minimum Required Setup:**
- 1 Realm
- 3 Roles (ADMIN, MANAGER, USER)
- 1 Client (inventory-orchestrator-backend)
- 1 Mapper (realm-roles)
- At least 1 test user with ADMIN role

That's it! Your Keycloak is now configured for the Inventory Orchestrator backend.
