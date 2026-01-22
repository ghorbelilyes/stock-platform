# Setup Guide for New Team Members

This guide will help you set up the backend project from scratch.

## Step 1: Install Prerequisites

### Java 25
```bash
# Check Java version
java -version

# Should show: openjdk version "25" or similar
# If not installed, download from: https://jdk.java.net/25/
```

### Maven
```bash
# Check Maven version
mvn -version

# Should show: Apache Maven 3.6+ or higher
# Install: https://maven.apache.org/install.html
```

### PostgreSQL
```bash
# Check PostgreSQL version
psql --version

# Install PostgreSQL:
# Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib
# macOS: brew install postgresql
# Windows: Download from https://www.postgresql.org/download/
```

## Step 2: Clone and Navigate

```bash
cd backend
```

## Step 3: Database Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d

# Database will be created automatically
# Default credentials:
# - Database: store
# - Username: postgres
# - Password: postgres
```

### Option B: Manual Setup

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql    # macOS

# Create database
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE store;
\q
```

## Step 4: Configure Application

Edit `src/main/resources/application.properties`:

```properties
# Update these if needed:
spring.datasource.url=jdbc:postgresql://localhost:5432/store
spring.datasource.username=postgres
spring.datasource.password=postgres
```

## Step 5: Build Project

```bash
# Clean and build
mvn clean install

# If build succeeds, you're ready to run!
```

## Step 6: Run Application

```bash
# Run the application
mvn spring-boot:run

# You should see:
# "Started InventoryOrchestratorApplication in X.XXX seconds"
```

## Step 7: Verify Setup

### Test API Endpoint

```bash
# Get all products (should return empty array initially)
curl http://localhost:8080/api/products

# Expected response:
# {"success":true,"data":[],"message":"Products retrieved successfully"}
```

### Check Database Tables

```bash
psql -U postgres -d store

# List tables
\dt

# You should see:
# - store
# - product
# - stock
# - sales
# - transfer
# - file_upload
# - file_upload_errors
```

## Step 8: IDE Setup

### IntelliJ IDEA

1. Open project: `File > Open > Select backend folder`
2. Wait for Maven import
3. Set JDK: `File > Project Structure > Project > SDK: Java 25`
4. Run: Right-click `InventoryOrchestratorApplication.java > Run`

### Eclipse

1. Import: `File > Import > Maven > Existing Maven Projects`
2. Select `backend` folder
3. Set JDK: `Project > Properties > Java Build Path > Libraries > Add Library > JRE System Library`
4. Run: Right-click `InventoryOrchestratorApplication.java > Run As > Java Application`

### VS Code

1. Install extensions:
   - Java Extension Pack
   - Spring Boot Extension Pack
2. Open folder: `File > Open Folder > Select backend`
3. Run: `F5` or click "Run" button

## Common Issues & Solutions

### Issue: "Java version mismatch"
**Solution:** Ensure Java 25 is installed and set as JAVA_HOME

### Issue: "Port 8080 already in use"
**Solution:** 
```bash
# Find process
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process or change port in application.properties
```

### Issue: "Database connection failed"
**Solution:**
- Check PostgreSQL is running
- Verify database exists: `psql -U postgres -l`
- Check credentials in `application.properties`

### Issue: "Maven build fails"
**Solution:**
```bash
# Clean Maven cache
rm -rf ~/.m2/repository

# Rebuild
mvn clean install -U
```

## Next Steps

1. Read `README.md` for API documentation
2. Explore the codebase structure
3. Check `API_EXAMPLES.md` for API usage examples
4. Review entity relationships in code comments

## Development Workflow

1. **Make changes** to code
2. **Build**: `mvn clean compile`
3. **Test**: `mvn test`
4. **Run**: `mvn spring-boot:run`
5. **Test API** using Postman or cURL

## Useful Commands

```bash
# Build without tests
mvn clean package -DskipTests

# Run specific test
mvn test -Dtest=ClassName

# Check for updates
mvn versions:display-dependency-updates

# Format code (if using formatter)
mvn formatter:format
```

## Getting Help

- Check `README.md` for detailed documentation
- Review code comments
- Check Spring Boot documentation: https://spring.io/projects/spring-boot
- Ask team members
