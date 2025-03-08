#!/bin/bash
set -e

echo "Starting ClimateInsight React application"

# Change to the project root directory
cd "$(dirname "$0")"

# Check if there are any running instances of the server and stop them
echo "Stopping any running processes..."
pkill -f "node server.js" || true

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update the .env file with your API keys."
fi

# Build and deploy React frontend
echo "Building and deploying the React frontend..."
cd frontend
npm install --silent
npm run deploy
cd ..

# Start the Node.js server
echo "Starting the Node.js server..."
node server.js &
SERVER_PID=$!

echo "ClimateInsight is now running!"
echo "Access the application at http://localhost:8080"
echo "Press Ctrl+C to stop the application"

# Trap SIGINT to gracefully shut down
trap "echo 'Stopping server...'; kill $SERVER_PID; exit" INT

# Keep the script running
wait $SERVER_PID 