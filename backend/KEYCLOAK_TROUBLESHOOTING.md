# Keycloak Troubleshooting Guide

## Error: 403 Forbidden on Admin Console

### Problem: `GET http://localhost:8180/admin/serverinfo 403 (Forbidden)`

This error typically occurs when:
1. You deleted the `master` realm (critical - should never be deleted)
2. Your admin session expired or is invalid
3. The realm you're trying to access doesn't exist
4. Keycloak needs to be restarted

---

## Solution 1: Check if Master Realm Exists

**⚠️ CRITICAL:** The `master` realm should NEVER be deleted. It's required for Keycloak to function.

### Check Master Realm

1. **Look at the realm dropdown** (top-left corner)
   - If you see `master` in the dropdown → Good, it exists
   - If you don't see `master` → **CRITICAL PROBLEM**

2. **If master realm is missing:**
   - You need to restore it or recreate Keycloak
   - See Solution 4 below

---

## Solution 2: Clear Browser Session and Re-login

### Steps:

1. **Clear Browser Cache/Cookies:**
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Clear cookies and cached data for `localhost:8180`
   - Or use Incognito/Private mode

2. **Close all Keycloak tabs**

3. **Reopen Keycloak:**
   - Go to: `http://localhost:8180`
   - Click "Administration Console"
   - Login with admin credentials:
     - Username: `admin`
     - Password: `admin` (or your password)

4. **Select Master Realm:**
   - In the realm dropdown (top-left), select `master`
   - This is the default admin realm

---

## Solution 3: Restart Keycloak

### If using Docker:

```bash
# Stop Keycloak
docker-compose -f docker-compose.keycloak.yml down

# Start again
docker-compose -f docker-compose.keycloak.yml up -d

# Wait 30-60 seconds for startup
docker-compose -f docker-compose.keycloak.yml logs -f
```

### If running manually:

```bash
# Stop Keycloak (Ctrl+C in terminal, or kill process)
# Then restart
cd ~/keycloak/keycloak-25.0.0
bin/kc.sh start-dev --http-port=8180
```

---

## Solution 4: Recreate Inventory-Orchestrator Realm

If you deleted the `inventory-orchestrator` realm (not master), you can recreate it:

### Option A: Import from JSON (if you have backup)

1. **If you have the realm JSON file:**
   ```bash
   # Import realm
   docker exec -it keycloak /opt/keycloak/bin/kc.sh import \
     --file /tmp/realm-inventory-orchestrator.json \
     --override true
   ```

2. **Or via Admin Console:**
   - Login to master realm
   - Click realm dropdown → "Create Realm"
   - Click "Import" button
   - Select your realm JSON file
   - Click "Create"

### Option B: Recreate Manually

Follow the setup guide again:
1. Create realm: `inventory-orchestrator`
2. Create roles: `ADMIN`, `MANAGER`, `USER`
3. Create client: `inventory-orchestrator-backend`
4. Create mapper: `realm-roles`
5. Create users

---

## Solution 5: Check Keycloak Logs

### View Logs:

**Docker:**
```bash
docker-compose -f docker-compose.keycloak.yml logs keycloak
# Or follow logs
docker-compose -f docker-compose.keycloak.yml logs -f keycloak
```

**Manual:**
```bash
tail -f ~/keycloak/keycloak-25.0.0/data/log/keycloak.log
```

**Look for errors:**
- Database connection issues
- Realm not found errors
- Authentication failures

---

## Solution 6: Access Master Realm Directly

Try accessing master realm directly:

1. **Direct URL:**
   ```
   http://localhost:8180/admin/master/console/
   ```

2. **Or:**
   ```
   http://localhost:8180/realms/master/account/
   ```

3. **Login with admin credentials**

---

## Solution 7: Reset Keycloak (Last Resort)

If nothing works, you may need to reset Keycloak:

### Docker - Fresh Start:

```bash
# Stop and remove containers
docker-compose -f docker-compose.keycloak.yml down -v

# Remove volumes (deletes all data)
docker volume rm keycloak-db-data

# Start fresh
docker-compose -f docker-compose.keycloak.yml up -d
```

**⚠️ WARNING:** This deletes all data. You'll need to recreate everything.

### Manual - Clean Start:

```bash
# Stop Keycloak
# Remove data directory
rm -rf ~/keycloak/keycloak-25.0.0/data

# Restart
cd ~/keycloak/keycloak-25.0.0
bin/kc.sh start-dev --http-port=8180
```

---

## Quick Fix Checklist

Try these in order:

- [ ] **1. Clear browser cache/cookies**
- [ ] **2. Try incognito/private mode**
- [ ] **3. Restart Keycloak**
- [ ] **4. Check master realm exists** (top-left dropdown)
- [ ] **5. Login to master realm** (not inventory-orchestrator)
- [ ] **6. Check Keycloak logs** for errors
- [ ] **7. Recreate inventory-orchestrator realm** if deleted
- [ ] **8. Reset Keycloak** (last resort)

---

## Common Scenarios

### Scenario 1: Deleted inventory-orchestrator Realm

**Solution:**
1. Login to `master` realm
2. Recreate `inventory-orchestrator` realm
3. Follow setup guide again

### Scenario 2: Deleted Master Realm (CRITICAL)

**Solution:**
- This is a critical error
- You need to reset Keycloak completely
- See Solution 7 above

### Scenario 3: Session Expired

**Solution:**
- Clear cookies
- Re-login
- Select correct realm

### Scenario 4: Keycloak Not Fully Started

**Solution:**
- Wait 30-60 seconds after starting
- Check logs: `docker logs keycloak`
- Verify health: `curl http://localhost:8180/health`

---

## Verify Keycloak is Running

```bash
# Check if Keycloak is running
curl http://localhost:8180/health

# Should return JSON with status
```

---

## After Fixing: Recreate Your Setup

Once you can access the admin console:

1. ✅ Login to `master` realm
2. ✅ Create `inventory-orchestrator` realm
3. ✅ Follow `KEYCLOAK_QUICK_SETUP.md` guide
4. ✅ Create roles, client, mapper, users

---

## Prevention

To avoid this in the future:

1. **Never delete `master` realm** - it's required
2. **Export realms before deleting** - backup your configuration
3. **Use separate realms for testing** - don't delete production realms
4. **Regular backups** - export realm JSON files

---

## Export Realm (Backup)

Before making changes, always export:

1. Go to **Realm Settings**
2. Click **"Action"** dropdown (top-right)
3. Click **"Export"**
4. Select **"Export as JSON"**
5. Download and save the file

This way you can restore if something goes wrong.
