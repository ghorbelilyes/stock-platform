# Quick Start Guide

## Run Everything (Full Stack)

```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:4200
- Backend: http://localhost:8080/api
- Swagger: http://localhost:8080/api/swagger-ui

---

## Run Only Backend

```bash
# Option 1: Use dedicated compose file
docker-compose -f docker-compose.backend.yml up --build

# Option 2: Use main compose file
docker-compose up --build postgres backend
```

This starts:
- PostgreSQL database (port 5433)
- Spring Boot backend (port 8080)

Access:
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui

---

## Run Only Frontend

**Prerequisites**: Backend must be running on `localhost:8080` (either locally or in Docker)

```bash
# Option 1: Use dedicated compose file
docker-compose -f docker-compose.frontend.yml up --build

# Option 2: Use main compose file
docker-compose up --build frontend
```

Access:
- Frontend: http://localhost:4200

**Note**: The frontend will proxy API calls to `http://localhost:8080/api`. If your backend runs on a different port, edit `front/nginx.conf.standalone` before building.

---

## Common Commands

```bash
# Stop all services
docker-compose down

# Stop specific services
docker-compose stop backend frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild specific service
docker-compose up --build backend

# Run in background
docker-compose up -d
```

---

## Development Scenarios

### Scenario 1: Backend in Docker, Frontend Local
```bash
# Start backend
docker-compose -f docker-compose.backend.yml up -d

# Run frontend locally
cd front
npm install
npm start
```

### Scenario 2: Frontend in Docker, Backend Local
```bash
# Start backend locally (mvn spring-boot:run)
# Then start frontend in Docker
docker-compose -f docker-compose.frontend.yml up --build
```

### Scenario 3: Everything in Docker
```bash
docker-compose up --build
```
