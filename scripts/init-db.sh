#!/bin/bash

# Exit on error
set -e

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running or not properly configured"
  exit 1
fi

# Start PostgreSQL container if not running
if [ ! "$(docker ps -q -f name=blindscommerce-postgres)" ]; then
  if [ "$(docker ps -aq -f status=exited -f name=blindscommerce-postgres)" ]; then
    # Cleanup if container exists but is stopped
    docker rm blindscommerce-postgres
  fi

  echo "Starting PostgreSQL container..."
  docker-compose up -d postgres

  # Wait for PostgreSQL to be ready
  echo "Waiting for PostgreSQL to be ready..."
  until docker exec blindscommerce-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
  done
  echo "PostgreSQL is ready!"

  # Give some additional time for full initialization
  sleep 3
else
  echo "PostgreSQL container is already running."
fi

# Execute the schema SQL file
echo "Initializing database with schema..."
docker exec -i blindscommerce-postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/schema.sql

echo "Database initialization complete!"
