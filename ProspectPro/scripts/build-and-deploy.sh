#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define environment variables
ENV_FILE=".env.production"

# Load environment variables from the specified file
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Environment file $ENV_FILE not found."
  exit 1
fi

# Build the Docker image for production
echo "Building the production Docker image..."
docker build -f docker/Dockerfile.production -t prospectpro:latest .

# Run database migrations
echo "Running database migrations..."
docker run --rm prospectpro:latest npm run migrate

# Deploy the application using Docker Compose
echo "Deploying the application..."
docker-compose -f docker/docker-compose.yml up -d

echo "Build and deployment completed successfully."