# Fix: 403 Error in Keycloak Admin Console

## ✅ Good News: Your Realm Works!

The tests show:
- ✅ Realm exists and is accessible
- ✅ API authentication works
- ✅ Token contains ADMIN role

**The problem is only with the Admin Console login.**

---

## 🔧 The Issue

The logs show: `invalid_user_credentials` when trying to login to admin console.

**There are TWO different admin accounts:**

1. **Master Realm Admin** (for Keycloak itself)
   - Username: `admin`
   - Password: `admin` (set when starting Keycloak)

2. **Your Realm Admin** (for your application)
   - Username: `admin`
   - Password: `admin123` (from your realm JSON)

---

## 🎯 Solution: Use Correct Credentials

### Option 1: Login to Master Realm First (Recommended)

1. **Go to:** `http://localhost:8180`
2. **Click:** "Administration Console"
3. **Login with MASTER realm credentials:**
   - Username: `admin`
   - Password: `admin` (not admin123)
4. **After login, select your realm:**
   - Click realm dropdown (top-left)
   - Select `inventory-orchestrator`

### Option 2: Direct Access to Your Realm

1. **Go directly to your realm admin:**
   ```
   http://localhost:8180/admin/inventory-orchestrator/console/
   ```
2. **Login with YOUR realm credentials:**
   - Username: `admin`
   - Password: `admin123`

---

## 📋 Step-by-Step Fix

### Step 1: Clear Browser Session

1. **Close all Keycloak tabs**
2. **Clear cookies** for `localhost:8180`
   - Press `Ctrl+Shift+Delete`
   - Or use **Incognito/Private mode** (easiest)

### Step 2: Access Master Realm

1. **Open:** `http://localhost:8180`
2. **Click:** "Administration Console"
3. **Login:**
   - Username: `admin`
   - Password: `admin` (the Keycloak admin password)
4. **You should see the master realm**

### Step 3: Switch to Your Realm

1. **Click realm dropdown** (top-left, shows "master")
2. **Select:** `inventory-orchestrator`
3. **You should now see your realm!**

---

## 🔍 Verify Everything Works

### Test 1: Check Realm Exists

```bash
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration | grep issuer
```

**Expected:** `"issuer":"http://localhost:8180/realms/inventory-orchestrator"`

### Test 2: Test Authentication

```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

**Expected:** Returns `access_token` with `"realm_access":{"roles":["ADMIN"]}`

### Test 3: Test Backend API

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Test API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/products
```

**Expected:** Returns 200 OK with products data

---

## 🎯 Quick Reference: Credentials

| Purpose | Username | Password | Realm |
|---------|----------|----------|-------|
| **Keycloak Admin Console** | `admin` | `admin` | `master` |
| **Your App Admin User** | `admin` | `admin123` | `inventory-orchestrator` |
| **Manager User** | `manager` | `manager123` | `inventory-orchestrator` |
| **Regular User** | `user` | `user123` | `inventory-orchestrator` |

---

## 🚨 Still Getting 403?

### Check 1: Verify Master Realm Admin Password

If `admin` / `admin` doesn't work:

1. **Check Docker environment:**
   ```bash
   docker exec keycloak env | grep KEYCLOAK_ADMIN
   ```

2. **Or check docker-compose:**
   ```bash
   cat docker-compose.keycloak.yml | grep KEYCLOAK_ADMIN
   ```

3. **Reset admin password:**
   ```bash
   # Stop Keycloak
   docker-compose -f docker-compose.keycloak.yml down
   
   # Start with new admin password
   # Edit docker-compose.keycloak.yml and change:
   # KEYCLOAK_ADMIN_PASSWORD: your-new-password
   
   # Start again
   docker-compose -f docker-compose.keycloak.yml up -d
   ```

### Check 2: Verify Your Realm User

1. **Login to master realm** (with master admin)
2. **Switch to `inventory-orchestrator` realm**
3. **Go to Users** → `admin`
4. **Check:**
   - User is **Enabled** ✅
   - Password is set (not temporary)
   - Has **ADMIN** role assigned

### Check 3: Check Browser Console

1. **Open DevTools** (F12)
2. **Console tab** - look for errors
3. **Network tab** - check which request returns 403
4. **Check response** - what error message?

---

## ✅ Success Checklist

After following the steps, you should be able to:

- [ ] Access `http://localhost:8180` without 403
- [ ] Login to Admin Console (master realm)
- [ ] Switch to `inventory-orchestrator` realm
- [ ] See roles: ADMIN, MANAGER, USER
- [ ] See client: inventory-orchestrator-backend
- [ ] See users: admin, manager, user
- [ ] Test API authentication works
- [ ] Test backend API with token works

---

## Summary

**The 403 error is because:**
- You're trying to login with wrong credentials
- Master realm admin: `admin` / `admin`
- Your realm admin: `admin` / `admin123`

**Solution:**
1. Use **Incognito mode**
2. Login to **master realm** with `admin` / `admin`
3. Then **switch** to `inventory-orchestrator` realm

**Your realm is working perfectly!** The API tests prove it. Just need to use the right credentials for the admin console.
