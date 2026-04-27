#!/bin/bash
set -e

echo "=== AlmaDrive Deploy ==="

# Check .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example → .env and fill in real values."
  exit 1
fi

# Pull latest
git pull origin main

# Build
echo "Building containers..."
docker compose build --no-cache frontend backend

# Start everything
docker compose up -d

# Run migrations
echo "Running DB migrations..."
sleep 5
docker compose exec -T backend alembic upgrade head

echo "=== Done! ==="
docker compose ps
