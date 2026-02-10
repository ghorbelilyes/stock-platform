# Keycloak 403 Error Diagnostic Guide

## Quick Diagnostic Steps

### Step 1: Test Realm Access

```bash
# Test if realm exists
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration

# Should return JSON with issuer, endpoints, etc.
# If 404: Realm doesn't exist
# If 403: Access issue
```

### Step 2: Test Authentication

```bash
# Test admin user login
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"

# Expected: Returns access_token
# If 401: Wrong credentials or user doesn't exist
# If 403: Client configuration issue
```

### Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors when accessing `http://localhost:8180`
4. Go to **Network** tab
5. Try accessing Keycloak again
6. Check the failed request:
   - What URL returns 403?
   - What's the response body?

---

## Common 403 Scenarios

### Scenario 1: Admin Console 403

**Error:** `GET http://localhost:8180/admin/serverinfo 403`

**Causes:**
- Browser session expired
- Trying to access deleted realm
- Not logged in

**Fix:**
1. Clear browser cookies for `localhost:8180`
2. Use incognito mode
3. Login fresh: `http://localhost:8180` → Administration Console
4. Select `master` realm first, then switch to `inventory-orchestrator`

### Scenario 2: Token Endpoint 403

**Error:** `POST /realms/inventory-orchestrator/protocol/openid-connect/token 403`

**Causes:**
- Client not configured correctly
- Direct access grants disabled
- Client not enabled

**Fix:**
1. Go to **Clients** → `inventory-orchestrator-backend`
2. Check:
   - ✅ **Enabled**: ON
   - ✅ **Direct access grants**: ON
   - ✅ **Standard flow**: ON
3. Save and retry

### Scenario 3: API Endpoint 403

**Error:** Backend API returns 403

**Causes:**
- Token doesn't contain required roles
- User doesn't have correct role
- Role mapper not configured

**Fix:**
1. Decode token at jwt.io
2. Check `realm_access.roles` contains `["ADMIN"]`
3. If missing:
   - Check user has role assigned
   - Check client mapper is configured
   - User must re-login

---

## Step-by-Step Fix

### Fix 1: Clear Everything and Start Fresh

```bash
# 1. Stop Keycloak
docker-compose -f docker-compose.keycloak.yml down

# 2. Remove volumes (WARNING: deletes all data)
docker-compose -f docker-compose.keycloak.yml down -v

# 3. Start fresh
docker-compose -f docker-compose.keycloak.yml up -d

# 4. Wait 30 seconds
sleep 30

# 5. Import realm
docker cp backend/keycloak/realm-inventory-orchestrator.json keycloak:/opt/keycloak/data/import/realm-inventory-orchestrator.json

# 6. Restart to import
docker-compose -f docker-compose.keycloak.yml restart keycloak
```

### Fix 2: Verify Realm Exists

```bash
# Check realm
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration | jq .issuer

# Should return: "http://localhost:8180/realms/inventory-orchestrator"
```

### Fix 3: Verify Client Configuration

1. Login to Keycloak Admin Console
2. Select `inventory-orchestrator` realm
3. Go to **Clients** → `inventory-orchestrator-backend`
4. **Settings tab:**
   - **Enabled**: ✅ ON
   - **Access Type**: `public`
5. **Capability config:**
   - **Standard flow**: ✅ ON
   - **Direct access grants**: ✅ ON
6. Click **Save**

### Fix 4: Verify User and Role

1. Go to **Users** → `admin`
2. **Credentials tab:**
   - Password should be set
   - **Temporary**: ❌ OFF
3. **Role mapping tab:**
   - Should see `ADMIN` in **Assigned roles**

### Fix 5: Verify Mapper

1. Go to **Clients** → `inventory-orchestrator-backend` → **Mappers**
2. Should see `realm-roles` mapper
3. Check:
   - **Token Claim Name**: `realm_access.roles`
   - **Add to access token**: ✅ ON

---

## Test Script

Run this to test everything:

```bash
#!/bin/bash

echo "1. Testing realm access..."
REALM_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration)
if [ "$REALM_CHECK" = "200" ]; then
  echo "✅ Realm exists"
else
  echo "❌ Realm not found (HTTP $REALM_CHECK)"
  exit 1
fi

echo "2. Testing authentication..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password")

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
  echo "✅ Authentication works"
  TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  echo "Token: ${TOKEN:0:50}..."
else
  echo "❌ Authentication failed"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "3. Testing backend API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/products)

if [ "$API_RESPONSE" = "200" ]; then
  echo "✅ Backend API works"
elif [ "$API_RESPONSE" = "401" ]; then
  echo "❌ Backend API: Unauthorized (token invalid)"
elif [ "$API_RESPONSE" = "403" ]; then
  echo "❌ Backend API: Forbidden (insufficient role)"
else
  echo "❌ Backend API: HTTP $API_RESPONSE"
fi
```

---

## Browser-Specific Fix

### Chrome/Edge

1. Press `F12` → **Application** tab
2. **Cookies** → `http://localhost:8180`
3. Delete all cookies
4. **Storage** → Clear site data
5. Refresh page

### Firefox

1. Press `F12` → **Storage** tab
2. **Cookies** → `http://localhost:8180`
3. Delete all
4. Refresh page

### Safari

1. **Develop** → **Show Web Inspector**
2. **Storage** → **Cookies**
3. Delete all for `localhost:8180`
4. Refresh page

---

## Direct Access URLs

Try these direct URLs:

**Master Realm Admin:**
```
http://localhost:8180/admin/master/console/
```

**Your Realm Admin:**
```
http://localhost:8180/admin/inventory-orchestrator/console/
```

**Realm Account:**
```
http://localhost:8180/realms/inventory-orchestrator/account/
```

---

## Still Getting 403?

1. **Check Keycloak logs:**
   ```bash
   docker logs keycloak --tail 50
   ```

2. **Check if realm exists:**
   ```bash
   curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration
   ```

3. **Restart Keycloak:**
   ```bash
   docker-compose -f docker-compose.keycloak.yml restart keycloak
   ```

4. **Check browser console** for specific error messages

5. **Try different browser** or incognito mode
