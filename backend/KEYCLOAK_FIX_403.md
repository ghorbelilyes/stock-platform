# Fix 403 Forbidden Error After Deleting Realm

## Quick Fix Steps

### Step 1: Clear Browser Session

1. **Close all Keycloak tabs**
2. **Clear browser cache/cookies:**
   - Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
   - Select "Cookies and site data"
   - Clear for `localhost:8180`
3. **Or use Incognito/Private mode** (easiest)

### Step 2: Access Master Realm Directly

1. **Open new browser window (or incognito)**
2. **Go directly to master realm:**
   ```
   http://localhost:8180/admin/master/console/
   ```
3. **Login:**
   - Username: `admin`
   - Password: `admin`

### Step 3: Import Your Realm (You Have the JSON File!)

You have the realm JSON file at: `backend/keycloak/realm-inventory-orchestrator.json`

**Option A: Import via Admin Console (Easiest)**

1. **Login to master realm** (from Step 2)
2. **Click realm dropdown** (top-left) → **"Create Realm"**
3. **Click "Import" button** (top-right)
4. **Select file:** `backend/keycloak/realm-inventory-orchestrator.json`
5. **Click "Create"**

**Option B: Import via CLI**

```bash
# Copy JSON file into container
docker cp backend/keycloak/realm-inventory-orchestrator.json keycloak:/tmp/realm.json

# Import realm
docker exec keycloak /opt/keycloak/bin/kc.sh import \
  --file /tmp/realm.json \
  --override true
```

### Step 4: Verify Realm is Restored

1. **Check realm dropdown** - should see `inventory-orchestrator`
2. **Select `inventory-orchestrator` realm**
3. **Verify:**
   - Go to **Realm settings** → **Roles** → Should see ADMIN, MANAGER, USER
   - Go to **Clients** → Should see `inventory-orchestrator-backend`
   - Go to **Users** → Should see admin, manager, user

---

## Alternative: Quick Restart

If import doesn't work, restart Keycloak:

```bash
# Restart Keycloak
docker-compose -f docker-compose.keycloak.yml restart keycloak

# Wait 30 seconds, then try again
```

---

## Why This Happened

When you delete a realm:
- Your browser session still tries to access that realm
- Keycloak returns 403 because the realm doesn't exist
- Solution: Clear session and access master realm first

---

## Prevention

**Before deleting realms:**
1. ✅ Export realm JSON (backup)
2. ✅ Make sure you're in master realm
3. ✅ Only delete test realms, never production

**You already have the backup JSON file!** Just import it.
