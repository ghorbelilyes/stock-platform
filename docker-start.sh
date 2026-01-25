#!/bin/bash

# Docker Start Script for Inventory Orchestrator
# This script helps you start the entire application stack

set -e

echo "🚀 Starting Inventory Orchestrator with Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed."
    exit 1
fi

# Function to check if compose v2 is available
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "📦 Building and starting all services..."
echo ""

# Build and start services
$COMPOSE_CMD up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
$COMPOSE_CMD ps

echo ""
echo "✅ Services are starting up!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend:  http://localhost:4200"
echo "   Backend:   http://localhost:8080/api"
echo "   Swagger:   http://localhost:8080/api/swagger-ui"
echo ""
echo "📝 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
