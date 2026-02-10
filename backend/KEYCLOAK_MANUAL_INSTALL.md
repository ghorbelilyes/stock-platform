# Keycloak Manual Installation Guide (Without Docker)

This guide explains how to install and run Keycloak manually on your system without Docker.

## Prerequisites

- **Java 17, 21, or 22** (Keycloak 25.0 supports Java 17, 21, and 22 - **NOT Java 25**)
- **PostgreSQL** (optional, but recommended for production)
- **At least 512MB RAM** available
- **Linux, macOS, or Windows**

**⚠️ Important:** Keycloak 25.0.0 does **NOT** support Java 25. If you have Java 25, you need to:
- Install Java 21 (recommended) or Java 17
- Or use Docker (which handles Java version automatically)
- Or see `KEYCLOAK_JAVA_VERSION_FIX.md` for workarounds

## Step 1: Install Java

### Check Java Version

```bash
java -version
```

You need Java 17 or higher. If not installed:

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

### macOS

```bash
# Using Homebrew
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Windows

1. Download Java 17 from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or [Adoptium](https://adoptium.net/)
2. Install and set `JAVA_HOME` environment variable

## Step 2: Download Keycloak

### Option A: Download Pre-built Distribution

```bash
# Create directory for Keycloak
mkdir -p ~/keycloak
cd ~/keycloak

# Download Keycloak 25.0.0
wget https://github.com/keycloak/keycloak/releases/download/25.0.0/keycloak-25.0.0.tar.gz

# Extract
tar -xzf keycloak-25.0.0.tar.gz
cd keycloak-25.0.0
```

### Option B: Using curl

```bash
curl -L -o keycloak-25.0.0.tar.gz \
  https://github.com/keycloak/keycloak/releases/download/25.0.0/keycloak-25.0.0.tar.gz

tar -xzf keycloak-25.0.0.tar.gz
cd keycloak-25.0.0
```

### Windows

1. Download from: https://github.com/keycloak/keycloak/releases/download/25.0.0/keycloak-25.0.0.zip
2. Extract to `C:\keycloak-25.0.0\`

## Step 3: Build Keycloak

Keycloak needs to be built before first use:

```bash
# Linux/macOS
bin/kc.sh build

# Windows
bin\kc.bat build
```

This creates the runtime distribution.

## Step 4: Create Admin User

### Development Mode (Quick Start)

For development/testing with in-memory H2 database:

```bash
# Linux/macOS
bin/kc.sh start-dev --http-port=8180

# Windows
bin\kc.bat start-dev --http-port=8180
```

On first run, you'll be prompted to create an admin user:
- Enter username: `admin`
- Enter password: `admin` (or your choice)

**Note:** Development mode uses H2 database (data is lost on restart).

### Production Mode (With PostgreSQL)

#### 4.1: Install and Setup PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

#### 4.2: Create Keycloak Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE keycloak;
CREATE USER keycloak WITH PASSWORD 'keycloak';
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
\q
```

#### 4.3: Configure Keycloak for PostgreSQL

```bash
# Build with PostgreSQL driver
bin/kc.sh build --db=postgres

# Or if already built, rebuild
bin/kc.sh build --db=postgres
```

#### 4.4: Start Keycloak with PostgreSQL

```bash
# Start Keycloak
bin/kc.sh start \
  --http-port=8180 \
  --db=postgres \
  --db-url=jdbc:postgresql://localhost:5432/keycloak \
  --db-username=keycloak \
  --db-password=keycloak
```

On first start, create admin user:
```bash
# In another terminal
bin/kc.sh add-user --username admin --password admin
```

Then restart Keycloak.

## Step 5: Access Keycloak

1. **Open browser:** `http://localhost:8180`
2. **Click:** "Administration Console"
3. **Login:**
   - Username: `admin`
   - Password: `admin` (or what you set)

## Step 6: Configure for Inventory Orchestrator

Follow the same setup steps as in `KEYCLOAK_SETUP.md`:

1. Create realm: `inventory-orchestrator`
2. Create roles: `ADMIN`, `MANAGER`, `USER`
3. Create client: `inventory-orchestrator-backend`
4. Configure role mapper
5. Create test users

## Running Keycloak

### Start Keycloak

**Development mode:**
```bash
bin/kc.sh start-dev --http-port=8180
```

**Production mode:**
```bash
bin/kc.sh start \
  --http-port=8180 \
  --db=postgres \
  --db-url=jdbc:postgresql://localhost:5432/keycloak \
  --db-username=keycloak \
  --db-password=keycloak
```

### Stop Keycloak

Press `Ctrl+C` in the terminal, or:

```bash
# Find process
ps aux | grep keycloak

# Kill process (replace PID with actual process ID)
kill <PID>
```

### Run in Background (Linux/macOS)

**Using nohup:**
```bash
nohup bin/kc.sh start-dev --http-port=8180 > keycloak.log 2>&1 &
```

**Using screen:**
```bash
screen -S keycloak
bin/kc.sh start-dev --http-port=8180
# Press Ctrl+A then D to detach
# Reattach: screen -r keycloak
```

**Using tmux:**
```bash
tmux new -s keycloak
bin/kc.sh start-dev --http-port=8180
# Press Ctrl+B then D to detach
# Reattach: tmux attach -t keycloak
```

## Create Systemd Service (Linux)

For automatic startup on boot:

### Create Service File

```bash
sudo nano /etc/systemd/system/keycloak.service
```

Add this content:

```ini
[Unit]
Description=Keycloak Authorization Server
After=network.target postgresql.service

[Service]
Type=simple
User=your-username
Group=your-group
WorkingDirectory=/home/your-username/keycloak/keycloak-25.0.0
ExecStart=/home/your-username/keycloak/keycloak-25.0.0/bin/kc.sh start \
  --http-port=8180 \
  --db=postgres \
  --db-url=jdbc:postgresql://localhost:5432/keycloak \
  --db-username=keycloak \
  --db-password=keycloak
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Update paths** to match your installation.

### Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable keycloak

# Start service
sudo systemctl start keycloak

# Check status
sudo systemctl status keycloak

# View logs
sudo journalctl -u keycloak -f
```

## Create Launch Script

Create a convenient script to start/stop Keycloak:

### Linux/macOS Script

Create `start-keycloak.sh`:

```bash
#!/bin/bash

KEYCLOAK_HOME="$HOME/keycloak/keycloak-25.0.0"
PORT=8180

cd "$KEYCLOAK_HOME"

# Development mode
bin/kc.sh start-dev --http-port=$PORT

# Or production mode (uncomment and configure)
# bin/kc.sh start \
#   --http-port=$PORT \
#   --db=postgres \
#   --db-url=jdbc:postgresql://localhost:5432/keycloak \
#   --db-username=keycloak \
#   --db-password=keycloak
```

Make executable:
```bash
chmod +x start-keycloak.sh
```

Run:
```bash
./start-keycloak.sh
```

### Windows Batch Script

Create `start-keycloak.bat`:

```batch
@echo off
cd C:\keycloak-25.0.0
bin\kc.bat start-dev --http-port=8180
pause
```

## Configuration Files

### Keycloak Configuration

Keycloak configuration is in `conf/keycloak.conf`:

```bash
# Edit configuration
nano conf/keycloak.conf
```

Example configuration:

```properties
# HTTP
http-port=8180
http-host=0.0.0.0

# Database
db=postgres
db-url=jdbc:postgresql://localhost:5432/keycloak
db-username=keycloak
db-password=keycloak

# Hostname
hostname-strict=false
hostname-strict-https=false

# Logging
log-level=INFO
```

Then start with:
```bash
bin/kc.sh start
```

### Environment Variables

You can also use environment variables:

```bash
export KC_HTTP_PORT=8180
export KC_DB=postgres
export KC_DB_URL=jdbc:postgresql://localhost:5432/keycloak
export KC_DB_USERNAME=keycloak
export KC_DB_PASSWORD=keycloak

bin/kc.sh start
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8180
lsof -i :8180
# Or
netstat -an | grep 8180

# Kill process
kill <PID>
```

### Java Not Found

```bash
# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Verify
java -version
```

### Permission Denied

```bash
# Make scripts executable
chmod +x bin/kc.sh
chmod +x bin/*.sh
```

### Database Connection Error

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Test connection:
   ```bash
   psql -h localhost -U keycloak -d keycloak
   ```

3. Check firewall:
   ```bash
   sudo ufw allow 5432/tcp
   ```

### Out of Memory

Increase heap size:

```bash
export JAVA_OPTS="-Xms512m -Xmx2048m"
bin/kc.sh start-dev --http-port=8180
```

Or edit `bin/kc.sh` and modify:
```bash
JAVA_OPTS="-Xms512m -Xmx2048m"
```

## Logs

### View Logs

**Development mode:**
Logs appear in the terminal.

**Production mode:**
```bash
# Default location
tail -f data/log/keycloak.log

# Or if configured
tail -f /var/log/keycloak/keycloak.log
```

### Log Levels

Set log level:
```bash
bin/kc.sh start-dev --http-port=8180 --log-level=DEBUG
```

## Backup and Restore

### Backup Realm

1. Use Admin Console: Realm Settings → Export
2. Or use CLI:
   ```bash
   bin/kc.sh export --realm inventory-orchestrator --file realm-backup.json
   ```

### Backup Database

```bash
# PostgreSQL backup
pg_dump -U keycloak keycloak > keycloak-backup.sql

# Restore
psql -U keycloak keycloak < keycloak-backup.sql
```

## Performance Tuning

### JVM Options

Create `bin/kc.conf` or set environment:

```bash
export JAVA_OPTS="-Xms1g -Xmx2g -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m"
```

### Database Connection Pool

Edit `conf/keycloak.conf`:
```properties
db-pool-initial-size=5
db-pool-max-size=20
```

## Security Considerations

1. **Change default admin password** immediately
2. **Use HTTPS** in production
3. **Restrict network access** (firewall)
4. **Regular backups** of database
5. **Keep Keycloak updated**

## Quick Reference

```bash
# Download and extract
wget https://github.com/keycloak/keycloak/releases/download/25.0.0/keycloak-25.0.0.tar.gz
tar -xzf keycloak-25.0.0.tar.gz
cd keycloak-25.0.0

# Build
bin/kc.sh build

# Start (development)
bin/kc.sh start-dev --http-port=8180

# Start (production with PostgreSQL)
bin/kc.sh start \
  --http-port=8180 \
  --db=postgres \
  --db-url=jdbc:postgresql://localhost:5432/keycloak \
  --db-username=keycloak \
  --db-password=keycloak

# Add admin user
bin/kc.sh add-user --username admin --password admin

# Stop
# Press Ctrl+C or kill process
```

## Next Steps

After Keycloak is running:

1. Access Admin Console: `http://localhost:8180`
2. Follow setup in `KEYCLOAK_SETUP.md`
3. Configure realm, roles, and client
4. Test authentication with backend

For detailed setup instructions, see `KEYCLOAK_SETUP.md` and `KEYCLOAK_RUNNING_GUIDE.md`.
