#!/bin/bash

# Exit on error
set -e

echo "Setting up ClimateInsight development environment..."

# Check for prerequisites
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Node.js and npm are required but not installed. Aborting."; exit 1; }
command -v clojure >/dev/null 2>&1 || { echo "Clojure CLI tools are required but not installed. Aborting."; exit 1; }

# Create the database if it doesn't exist
echo "Setting up PostgreSQL database..."
createdb climate_insight 2>/dev/null || echo "Database already exists, skipping creation."
psql -d climate_insight -c "CREATE EXTENSION IF NOT EXISTS postgis;" || { echo "Failed to create PostGIS extension. Make sure PostGIS is installed."; exit 1; }

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Copy .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
  echo "Please update the .env file with your credentials."
fi

# Run database migrations
echo "Running database migrations..."
clojure -M:migrate

echo "Setup complete! You can now start the application:"
echo "1. Start the backend: clojure -M:dev"
echo "2. Start the frontend: npm run dev"
echo "3. Open your browser at http://localhost:8080" 