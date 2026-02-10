# Keycloak Fresh Reset Guide

## Complete Reset (Like First Time)

This guide shows how to completely reset Keycloak to a fresh state, deleting all data and starting over.

---

## ⚠️ WARNING

**This will DELETE ALL Keycloak data:**
- All realms
- All users
- All clients
- All configurations

**Make sure you have backups if needed!**

---

## Quick Reset (One Command)

```bash
# Stop, remove volumes, start fresh
cd /home/ilyes/Desktop/3d-prime/sakai-ng
docker-compose -f docker-compose.keycloak.yml down -v
docker-compose -f docker-compose.keycloak.yml up -d

# Wait 30-60 seconds for startup
sleep 40

# Import realm
docker cp backend/keycloak/realm-inventory-orchestrator.json keycloak:/opt/keycloak/data/import/realm-inventory-orchestrator.json
docker-compose -f docker-compose.keycloak.yml restart keycloak

# Wait for import
sleep 15

# Verify
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration | grep issuer
```

---

## Step-by-Step Reset

### Step 1: Stop and Remove Everything

```bash
cd /home/ilyes/Desktop/3d-prime/sakai-ng

# Stop containers and remove volumes (deletes all data)
docker-compose -f docker-compose.keycloak.yml down -v

# Verify volumes are removed
docker volume ls | grep keycloak
# Should show nothing
```

### Step 2: Start Fresh

```bash
# Start Keycloak and database
docker-compose -f docker-compose.keycloak.yml up -d

# Wait for startup (30-60 seconds)
docker-compose -f docker-compose.keycloak.yml logs -f keycloak
# Press Ctrl+C when you see: "Keycloak ... started"
```

### Step 3: Import Realm

```bash
# Copy realm JSON to container
docker cp backend/keycloak/realm-inventory-orchestrator.json keycloak:/opt/keycloak/data/import/realm-inventory-orchestrator.json

# Restart to trigger import
docker-compose -f docker-compose.keycloak.yml restart keycloak

# Wait for import (15-30 seconds)
sleep 20

# Check import logs
docker logs keycloak | grep -i "import\|realm"
# Should see: "Realm 'inventory-orchestrator' imported"
```

### Step 4: Verify

```bash
# Test realm exists
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration | grep issuer

# Test authentication
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

---

## Access Admin Console

After reset:

1. **Open browser:** `http://localhost:8180`
2. **Click:** "Administration Console"
3. **Login:**
   - Username: `admin`
   - Password: `admin` (Keycloak admin password)
4. **You'll see only `master` realm** (fresh install)
5. **Switch to `inventory-orchestrator`** realm (imported from JSON)

---

## What Gets Reset

✅ **Deleted:**
- All realms (except master)
- All users
- All clients
- All roles
- All configurations
- Database data

✅ **Kept:**
- Master realm (always exists)
- Keycloak admin user (admin/admin)

✅ **Imported:**
- `inventory-orchestrator` realm (from JSON)
- 3 roles: ADMIN, MANAGER, USER
- Client: inventory-orchestrator-backend
- 3 users: admin, manager, user

---

## Troubleshooting

### Import Not Working

```bash
# Check if file exists in container
docker exec keycloak ls -la /opt/keycloak/data/import/

# Check import logs
docker logs keycloak | grep -i import

# Try manual import via Admin Console:
# 1. Login to master realm
# 2. Create Realm → Import
# 3. Upload realm-inventory-orchestrator.json
```

### Realm Not Appearing

```bash
# Check if realm was imported
docker logs keycloak | grep "inventory-orchestrator"

# Restart Keycloak
docker-compose -f docker-compose.keycloak.yml restart keycloak

# Wait and check again
sleep 20
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration
```

### Still Getting 403

1. **Clear browser cookies** for `localhost:8180`
2. **Use incognito mode**
3. **Login to master realm first:**
   - URL: `http://localhost:8180`
   - Username: `admin`
   - Password: `admin`
4. **Then switch to your realm**

---

## Manual Import (Alternative)

If automatic import doesn't work:

1. **Login to Admin Console:**
   - `http://localhost:8180`
   - Username: `admin` / Password: `admin`

2. **Import Realm:**
   - Click realm dropdown → "Create Realm"
   - Click "Import" button (top-right)
   - Select: `backend/keycloak/realm-inventory-orchestrator.json`
   - Click "Create"

3. **Verify:**
   - Switch to `inventory-orchestrator` realm
   - Check roles, clients, users exist

---

## Quick Reference

```bash
# Complete reset
docker-compose -f docker-compose.keycloak.yml down -v
docker-compose -f docker-compose.keycloak.yml up -d
sleep 40
docker cp backend/keycloak/realm-inventory-orchestrator.json keycloak:/opt/keycloak/data/import/
docker-compose -f docker-compose.keycloak.yml restart keycloak
sleep 20

# Verify
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration
```

---

## After Reset

Your Keycloak is now fresh with:
- ✅ Master realm (admin/admin)
- ✅ inventory-orchestrator realm (imported)
- ✅ 3 roles: ADMIN, MANAGER, USER
- ✅ Client: inventory-orchestrator-backend
- ✅ 3 users: admin/admin123, manager/manager123, user/user123

**Access Admin Console:**
- URL: `http://localhost:8180`
- Master admin: `admin` / `admin`
- Your realm admin: `admin` / `admin123`
