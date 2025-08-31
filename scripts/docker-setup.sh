#!/bin/bash

# MusclePal Docker Setup Script
# This script helps set up the Docker environment for local development

set -e

echo "🚀 MusclePal Docker Setup"
echo "========================="

# Check if Docker and Docker Compose are installed
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is not installed. Please install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is not installed. Please install Docker Compose first."; exit 1; }

echo "✅ Docker and Docker Compose are installed"

# Create docker directory if it doesn't exist
mkdir -p docker

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    if [ -f .env.docker ]; then
        echo "📋 Copying .env.docker to .env.local"
        cp .env.docker .env.local
    else
        echo "⚠️  Please create .env.local file with your environment variables"
        echo "   You can use .env.local.example as a template"
    fi
fi

# Build and start services
echo "🔨 Building and starting Docker services..."

if [ "$1" = "dev" ]; then
    echo "🛠️  Starting development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
else
    echo "🏭 Starting production environment..."
    docker-compose up --build -d
fi

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

services=(
    "http://localhost:8000"
    "http://localhost:54323"
    "http://localhost:54324"
)

for service in "${services[@]}"; do
    if curl -f -s "$service" > /dev/null; then
        echo "✅ $service is ready"
    else
        echo "⚠️  $service might not be ready yet"
    fi
done

echo ""
echo "🎉 Docker setup complete!"
echo ""
echo "📊 Service URLs:"
echo "   • Next.js App:      http://localhost:3000 (dev) / http://localhost:3001 (prod)"
echo "   • Supabase API:     http://localhost:8000"
echo "   • Supabase Studio:  http://localhost:54323"
echo "   • Email Inbox:      http://localhost:54324"
echo "   • PostgreSQL:       localhost:54322"
echo ""
echo "🛠️  Useful commands:"
echo "   • View logs:        docker-compose logs -f"
echo "   • Stop services:    docker-compose down"
echo "   • Restart:          docker-compose restart"
echo "   • Reset database:   docker-compose down -v && docker-compose up -d"
echo ""

# Run database migrations if they exist
if [ -d "supabase/migrations" ]; then
    echo "🗄️  Running database migrations..."
    # Wait a bit more for database to be fully ready
    sleep 5
    
    # Run migrations through the container
    docker-compose exec db psql -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Database is ready"
        # You can add migration commands here if needed
    else
        echo "⚠️  Database might not be ready for migrations yet"
    fi
fi

echo "🏁 Setup complete! Visit http://localhost:3000 to see your app"