#!/bin/bash
set -euo pipefail

echo "--- Starting services with docker-compose"
docker compose -f docker/docker-compose-local-linux.yml up -d

echo "--- Waiting for services to be ready"
sleep 10

until docker compose -f docker/docker-compose-local-linux.yml exec -T db pg_isready -U username; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

until docker compose -f docker/docker-compose-local-linux.yml exec -T redis redis-cli ping; do
  echo "Waiting for Redis..."
  sleep 2
done

echo "--- Services are ready"
