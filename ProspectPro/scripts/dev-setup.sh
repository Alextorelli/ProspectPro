#!/bin/bash

# This script sets up the development environment for the ProspectPro application.

# Exit immediately if a command exits with a non-zero status.
set -e

# Install dependencies
echo "Installing dependencies..."
npm install

# Copy the example environment file to .env
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
fi

# Run database migrations
echo "Running database migrations..."
npm run migrate

# Start the development server
echo "Starting the development server..."
npm run dev

echo "Development environment setup complete."