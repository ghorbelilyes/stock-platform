# Quick Fix: 403 Error After Deleting Realm

## ✅ Good News: Your Realm is Already Imported!

The logs show: `Realm 'inventory-orchestrator' imported` - so your realm exists!

The 403 error is just a browser session issue. Here's how to fix it:

---

## 🔧 Quick Fix (2 minutes)

### Step 1: Clear Browser Session

**Option A: Use Incognito/Private Mode (Easiest)**
1. Open a new **Incognito/Private window**
2. Go to: `http://localhost:8180`
3. Click "Administration Console"
4. Login: `admin` / `admin`

**Option B: Clear Cookies**
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cookies and site data"
3. Clear for `localhost:8180`
4. Refresh the page

### Step 2: Access Master Realm First

1. After login, look at the **realm dropdown** (top-left corner)
2. **Select `master`** (not inventory-orchestrator)
3. This ensures you're in a valid realm

### Step 3: Switch to Your Realm

1. Click the **realm dropdown** again
2. **Select `inventory-orchestrator`**
3. You should now see your realm with all settings!

---

## ✅ Verify Everything Works

1. **Check Roles:**
   - Go to **Realm settings** → **Roles** → **Realm roles**
   - Should see: `ADMIN`, `MANAGER`, `USER`

2. **Check Client:**
   - Go to **Clients**
   - Should see: `inventory-orchestrator-backend`

3. **Check Users:**
   - Go to **Users**
   - Should see: `admin`, `manager`, `user`

---

## 🎯 Direct Access URLs

If the dropdown doesn't work, try these direct URLs:

**Master Realm:**
```
http://localhost:8180/admin/master/console/
```

**Your Realm:**
```
http://localhost:8180/admin/inventory-orchestrator/console/
```

---

## Why This Happened

- You deleted the realm
- Your browser session was still trying to access it
- Keycloak returned 403 (realm not found)
- The realm was re-imported, but your browser still has the old session
- **Solution:** Clear session and re-login

---

## Test Your Setup

After accessing the realm, test authentication:

```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

Should return an access token! ✅

---

**That's it!** Your realm is already there, just clear your browser session and re-login.
