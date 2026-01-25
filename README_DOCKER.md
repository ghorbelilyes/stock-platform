# Docker Setup Guide

This guide explains how to run the entire application (Frontend + Backend + Database) using Docker.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)

## Quick Start

### 1. Build and Start All Services

From the project root directory:

```bash
docker-compose up --build
```

This will:
- Build the backend Spring Boot application
- Build the frontend Angular application
- Start PostgreSQL database
- Start all services in the correct order

### 2. Run Only Backend (with Database)

```bash
# Start backend and PostgreSQL only
docker-compose -f docker-compose.backend.yml up --build

# Or using the main compose file, specify services
docker-compose up --build postgres backend
```

### 3. Run Only Frontend

```bash
# Start frontend only (assumes backend is running on localhost:8080)
docker-compose -f docker-compose.frontend.yml up --build

# Or using the main compose file
docker-compose up --build frontend
```

**Note**: When running frontend only:
- The frontend expects the backend to be running on `localhost:8080` (your host machine)
- The frontend uses `host.docker.internal` to access the host's localhost
- If your backend runs on a different port, edit `front/nginx.conf.standalone` and change the proxy_pass port

### 2. Access the Application

Once all services are running:

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui
- **PostgreSQL**: localhost:5433 (username: postgres, password: postgres)
  
  **Note**: Port 5433 is used on the host to avoid conflicts with local PostgreSQL. Inside Docker, it still uses 5432.

### 3. Stop Services

```bash
docker-compose down
```

To also remove volumes (clean database):

```bash
docker-compose down -v
```

## Services

### PostgreSQL
- **Container**: `inventory-postgres`
- **Port**: 5432
- **Database**: `store`
- **Username**: `postgres`
- **Password**: `postgres`

### Backend (Spring Boot)
- **Container**: `inventory-backend`
- **Port**: 8080
- **Health Check**: http://localhost:8080/api/products

### Frontend (Angular + Nginx)
- **Container**: `inventory-frontend`
- **Port**: 4200
- **API Proxy**: All `/api/*` requests are proxied to the backend

## Running Individual Services

### Backend Only (with Database)

```bash
# Option 1: Use dedicated compose file
docker-compose -f docker-compose.backend.yml up --build

# Option 2: Use main compose file with service selection
docker-compose up --build postgres backend

# Access: http://localhost:8080/api
```

### Frontend Only

```bash
# Option 1: Use dedicated compose file
docker-compose -f docker-compose.frontend.yml up --build

# Option 2: Use main compose file with service selection
docker-compose up --build frontend

# Access: http://localhost:4200
# Note: Backend must be running separately (locally or in another container)
```

### Database Only

```bash
docker-compose up --build postgres

# Access: localhost:5433 (username: postgres, password: postgres)
```

## Development Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# For dedicated compose files
docker-compose -f docker-compose.backend.yml logs -f
docker-compose -f docker-compose.frontend.yml logs -f
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose up --build backend
docker-compose up --build frontend

# Rebuild all
docker-compose up --build
```

### Run in Detached Mode

```bash
docker-compose up -d --build
```

### Check Service Status

```bash
docker-compose ps
```

## Troubleshooting

### Port Already in Use

If ports 4200, 8080, or 5432 are already in use, you can modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "4201:80"  # Change frontend port
  - "8081:8080"  # Change backend port
  - "5433:5432"  # Change database port
```

### Database Connection Issues

If the backend can't connect to the database:
1. Check that PostgreSQL is healthy: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Ensure the backend waits for PostgreSQL: The `depends_on` with `condition: service_healthy` handles this

### Frontend Can't Reach Backend

The nginx configuration proxies `/api/*` requests to the backend. If you see CORS errors:
1. Check that the backend is running: `docker-compose ps`
2. Check nginx logs: `docker-compose logs frontend`
3. Verify the proxy configuration in `front/nginx.conf`

### Clean Start

To completely reset everything:

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

## Production Considerations

For production deployment, consider:

1. **Environment Variables**: Use `.env` file for sensitive data
2. **SSL/TLS**: Add SSL certificates and configure HTTPS
3. **Resource Limits**: Add memory and CPU limits to services
4. **Logging**: Configure centralized logging
5. **Monitoring**: Add health checks and monitoring tools
6. **Database Backups**: Set up automated database backups

## File Structure

```
.
├── docker-compose.yml          # Main Docker Compose configuration
├── backend/
│   ├── Dockerfile              # Backend Docker image
│   └── src/
├── front/
│   ├── Dockerfile              # Frontend Docker image
│   ├── nginx.conf              # Nginx configuration
│   └── src/
└── README_DOCKER.md            # This file
```
