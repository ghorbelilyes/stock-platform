# How to Restart/Rerun Keycloak

## Quick Restart (Docker)

### Restart Keycloak Only

```bash
# Restart Keycloak container
docker-compose -f docker-compose.keycloak.yml restart keycloak

# Or using docker directly
docker restart keycloak
```

### Restart All Services (Keycloak + Database)

```bash
# Restart everything
docker-compose -f docker-compose.keycloak.yml restart

# Or stop and start
docker-compose -f docker-compose.keycloak.yml down
docker-compose -f docker-compose.keycloak.yml up -d
```

---

## Full Restart (Clean Start)

### Stop and Start Fresh

```bash
# Stop everything
docker-compose -f docker-compose.keycloak.yml down

# Start again
docker-compose -f docker-compose.keycloak.yml up -d

# View logs to see startup
docker-compose -f docker-compose.keycloak.yml logs -f keycloak
```

### Wait for Startup

Keycloak takes 30-60 seconds to start. Wait until you see:

```
Keycloak 25.0.0 on JVM (powered by Quarkus 3.8.5) started
```

---

## Check Status

### Check if Running

```bash
# Check container status
docker ps | grep keycloak

# Or
docker-compose -f docker-compose.keycloak.yml ps
```

### Check Health

```bash
# Test if Keycloak is responding
curl http://localhost:8180/health

# Or test realm
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration | head -1
```

### View Logs

```bash
# View recent logs
docker logs keycloak --tail 50

# Follow logs (live)
docker logs keycloak -f

# Or with docker-compose
docker-compose -f docker-compose.keycloak.yml logs -f keycloak
```

---

## Manual Installation Restart

If you're running Keycloak manually (not Docker):

### Stop Keycloak

```bash
# If running in terminal, press Ctrl+C
# Or find and kill process
ps aux | grep keycloak
kill <PID>
```

### Start Keycloak

```bash
cd ~/keycloak/keycloak-25.0.0

# Development mode
bin/kc.sh start-dev --http-port=8180

# Production mode (with PostgreSQL)
bin/kc.sh start \
  --http-port=8180 \
  --db=postgres \
  --db-url=jdbc:postgresql://localhost:5432/keycloak \
  --db-username=keycloak \
  --db-password=keycloak
```

---

## Common Restart Scenarios

### Scenario 1: Keycloak Not Responding

```bash
# Restart
docker-compose -f docker-compose.keycloak.yml restart keycloak

# Wait 30 seconds
sleep 30

# Test
curl http://localhost:8180/health
```

### Scenario 2: Configuration Changed

```bash
# Restart to apply changes
docker-compose -f docker-compose.keycloak.yml restart keycloak
```

### Scenario 3: Import Realm

```bash
# Copy realm file
docker cp backend/keycloak/realm-inventory-orchestrator.json keycloak:/opt/keycloak/data/import/

# Restart to import
docker-compose -f docker-compose.keycloak.yml restart keycloak

# Check logs for import
docker logs keycloak | grep -i import
```

### Scenario 4: Fresh Start (Delete All Data)

```bash
# ⚠️ WARNING: This deletes all data!
docker-compose -f docker-compose.keycloak.yml down -v

# Start fresh
docker-compose -f docker-compose.keycloak.yml up -d

# Wait for startup
sleep 30

# Import realm again
docker cp backend/keycloak/realm-inventory-orchestrator.json keycloak:/opt/keycloak/data/import/
docker-compose -f docker-compose.keycloak.yml restart keycloak
```

---

## Quick Commands Reference

```bash
# Start
docker-compose -f docker-compose.keycloak.yml up -d

# Stop
docker-compose -f docker-compose.keycloak.yml down

# Restart
docker-compose -f docker-compose.keycloak.yml restart

# Restart specific service
docker-compose -f docker-compose.keycloak.yml restart keycloak

# View logs
docker-compose -f docker-compose.keycloak.yml logs -f

# Check status
docker-compose -f docker-compose.keycloak.yml ps

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.keycloak.yml down -v
```

---

## Verify After Restart

After restarting, verify everything works:

```bash
# 1. Check Keycloak is running
curl http://localhost:8180/health

# 2. Check realm exists
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration | grep issuer

# 3. Test authentication
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

---

## Troubleshooting

### Keycloak Won't Start

```bash
# Check logs for errors
docker logs keycloak --tail 100

# Check if port is in use
lsof -i :8180

# Check database connection
docker logs keycloak-db
```

### Port Already in Use

```bash
# Find what's using port 8180
lsof -i :8180
# Or
netstat -an | grep 8180

# Kill the process or change port in docker-compose
```

### Database Connection Error

```bash
# Check database is running
docker ps | grep keycloak-db

# Restart database
docker-compose -f docker-compose.keycloak.yml restart keycloak-db

# Wait, then restart Keycloak
sleep 10
docker-compose -f docker-compose.keycloak.yml restart keycloak
```

---

## Summary

**Quick restart:**
```bash
docker-compose -f docker-compose.keycloak.yml restart keycloak
```

**Full restart:**
```bash
docker-compose -f docker-compose.keycloak.yml down
docker-compose -f docker-compose.keycloak.yml up -d
```

**Wait 30-60 seconds** for Keycloak to fully start, then test!
