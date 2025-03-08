#!/bin/bash
set -e

echo "Building and deploying the React app..."

# Build the app
npm run build

# Deploy to resources/public
echo "Deploying to resources/public..."
rm -rf ../resources/public/*
cp -r dist/* ../resources/public/

echo "Deployment complete! The app has been deployed to the resources/public directory."
echo "You can now start the server with: node ../server.js" 