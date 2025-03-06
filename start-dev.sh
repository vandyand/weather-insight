#!/bin/bash
set -e

echo "Starting ClimateInsight development environment"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if the .env file exists, if not create it from example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update the .env file with your Mapbox API key."
fi

# Start PostgreSQL with PostGIS
echo "Starting PostgreSQL with PostGIS using Docker Compose..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo "PostgreSQL is ready!"

# Ensure the ClimateInsight database and PostGIS extension exist
echo "Setting up database..."
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE climate_insight;" > /dev/null 2>&1 || true
docker-compose exec postgres psql -U postgres -d climate_insight -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null 2>&1

# Install npm dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Export the Mapbox token from .env
if [ -f .env ]; then
    export MAPBOX_API_KEY=$(grep MAPBOX_API_KEY .env | cut -d '=' -f2)
    echo "Loaded Mapbox API key from .env"
fi

# Start the ClojureScript development server
echo "Starting ClojureScript development server..."
echo "The application will be available at http://localhost:8080"
echo "Press Ctrl+C to stop all services"

# Start shadow-cljs
npm run dev 