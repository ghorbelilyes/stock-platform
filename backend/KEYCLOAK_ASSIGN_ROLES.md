# How to Assign Roles to Users in Keycloak

This guide shows how to assign the ADMIN role (or any role) to a user so they have full access.

## Step-by-Step: Assign ADMIN Role to a User

### Option 1: Assign Role to Existing User

1. **Go to Users**
   - In Keycloak Admin Console, click **"Users"** in the left sidebar

2. **Select the User**
   - Find the user you want to make admin (or create a new user first)
   - Click on the username to open user details

3. **Go to Role Mappings Tab**
   - Click the **"Role mapping"** tab (at the top of user details)

4. **Assign Realm Role**
   - Click the **"Assign role"** button (top-right)
   - A dialog will open showing available roles

5. **Select ADMIN Role**
   - In the filter/search box, type: `ADMIN`
   - You'll see roles filtered
   - Check the box next to **"ADMIN"** (it should show as a realm role)
   - Click **"Assign"** button

6. **Verify Assignment**
   - You should now see `ADMIN` listed under **"Assigned roles"** in the Role mapping tab
   - The role should appear in the table

**Done!** The user now has ADMIN role and full access.

---

### Option 2: Create New User and Assign ADMIN Role

1. **Create User First**
   - Go to **"Users"** → Click **"Create new user"**
   - Fill in:
     - **Username**: `admin` (or your choice)
     - **Email**: `admin@example.com`
     - **First name**: `Admin`
     - **Last name**: `User`
     - **Email verified**: ✅ Toggle ON
     - **Enabled**: ✅ Toggle ON
   - Click **"Create"**

2. **Set Password**
   - Click **"Credentials"** tab
   - Click **"Set password"**
   - Enter password (e.g., `admin123`)
   - **Temporary**: ❌ Uncheck (OFF)
   - Click **"Save"** twice

3. **Assign ADMIN Role**
   - Click **"Role mapping"** tab
   - Click **"Assign role"** button
   - Search for: `ADMIN`
   - Select **"ADMIN"** (realm role)
   - Click **"Assign"**

**Done!** New admin user created with full access.

---

## Verify User Has ADMIN Role

### Method 1: Check in Keycloak UI

1. Go to **Users** → Select user
2. Click **"Role mapping"** tab
3. Under **"Assigned roles"**, you should see:
   - `ADMIN` (realm role)

### Method 2: Test with Token

1. **Get Access Token:**
```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

2. **Decode Token at jwt.io:**
   - Copy the `access_token` from response
   - Go to https://jwt.io
   - Paste token
   - Check payload - should see:
   ```json
   {
     "realm_access": {
       "roles": ["ADMIN"]
     }
   }
   ```

3. **Test API Access:**
```bash
# Use the access_token from step 1
TOKEN="your_access_token_here"

# Test admin endpoint (should work)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/files/required-columns/STOCK

# Should return 200 OK (not 403 Forbidden)
```

---

## Assign Multiple Roles

You can assign multiple roles to a user:

1. Go to user → **Role mapping** tab
2. Click **"Assign role"**
3. Select multiple roles (check boxes):
   - ✅ ADMIN
   - ✅ MANAGER
   - ✅ USER
4. Click **"Assign"**

The user will have all selected roles.

---

## Remove Role from User

1. Go to user → **Role mapping** tab
2. Find the role in **"Assigned roles"** table
3. Click the **"X"** button next to the role
4. Confirm removal

---

## Common Issues

### Role Not Showing in Token

**Problem:** User has role assigned but token doesn't include it.

**Solutions:**
1. **Check Client Mapper:**
   - Go to **Clients** → `inventory-orchestrator-backend` → **Mappers**
   - Verify `realm-roles` mapper exists
   - Check **"Add to access token"** is ✅ ON

2. **Re-login:**
   - User must log out and log back in to get new token
   - Or wait for token to expire and get new one

3. **Verify Role Assignment:**
   - Go to user → **Role mapping** tab
   - Confirm role is listed under **"Assigned roles"**

### User Still Getting 403 Forbidden

**Problem:** User has ADMIN role but still can't access admin endpoints.

**Solutions:**
1. **Verify Token:**
   - Decode token at jwt.io
   - Check `realm_access.roles` contains `["ADMIN"]`

2. **Check Backend Configuration:**
   - Verify backend is configured to use correct realm
   - Check `application.properties`:
     ```properties
     spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8180/realms/inventory-orchestrator
     ```

3. **Check Role Mapping:**
   - Backend maps `ADMIN` → `ROLE_ADMIN`
   - Verify this mapping in `KeycloakJwtAuthenticationConverter`

### Can't Find Role in Assign Dialog

**Problem:** Role doesn't appear when searching.

**Solutions:**
1. **Check Realm:**
   - Make sure you're in the correct realm (`inventory-orchestrator`)
   - Roles are realm-specific

2. **Verify Role Exists:**
   - Go to **Realm settings** → **Roles** → **Realm roles**
   - Confirm `ADMIN` role exists

3. **Check Filter:**
   - Clear the search filter
   - Look in **"Realm roles"** section (not client roles)

---

## Quick Reference

### Assign ADMIN Role
```
Users → Select User → Role mapping tab → Assign role → Search "ADMIN" → Assign
```

### Verify Role Assignment
```
Users → Select User → Role mapping tab → Check "Assigned roles" table
```

### Test Full Access
```bash
# Get token
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"

# Test admin endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/files/required-columns/STOCK
```

---

## Summary

**To give a user full access:**

1. ✅ Create/select user
2. ✅ Go to user → **Role mapping** tab
3. ✅ Click **"Assign role"**
4. ✅ Select **"ADMIN"** role
5. ✅ Click **"Assign"**
6. ✅ User now has full access to all endpoints

**That's it!** The user will have ADMIN role and can access all protected endpoints.
