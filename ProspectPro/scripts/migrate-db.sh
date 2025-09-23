#!/bin/bash

# This script handles database migrations for the ProspectPro application.

set -e

# Load environment variables
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Define database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-prospectpro}
DB_USER=${DB_USER:-user}
DB_PASSWORD=${DB_PASSWORD:-password}

# Run database migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate --host $DB_HOST --port $DB_PORT --database $DB_NAME --username $DB_USER --password $DB_PASSWORD

echo "Database migrations completed successfully."