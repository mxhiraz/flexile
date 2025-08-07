#!/bin/bash
set -euo pipefail

# Set Docker Compose project name
export COMPOSE_PROJECT_NAME=flexile-ci

# Cleanup function
cleanup() {
  echo "--- Cleaning up services"
  docker compose -f docker/docker-compose-local-linux.yml down || true
}
trap cleanup EXIT

echo "--- Starting services"
docker compose -f docker/docker-compose-local-linux.yml up -d db redis

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

echo "--- Building test image"
docker build -t flexile-test -f .buildkite/Dockerfile.test .

echo "--- Setting up docker-compose network"
COMPOSE_NETWORK="${COMPOSE_PROJECT_NAME}_default"

echo "--- Running RSpec tests (network: $COMPOSE_NETWORK)"
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  -e RAILS_ENV=test \
  -e DATABASE_URL="postgresql://username:password@db:5432/flexile_test" \
  -e REDIS_URL="redis://redis:6379" \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
  -e STRIPE_SECRET_KEY \
  -e WISE_API_KEY \
  -e WISE_PROFILE_ID \
  -e KNAPSACK_PRO_TEST_SUITE_TOKEN_RSPEC \
  -e RUBY_YJIT_ENABLE=1 \
  --network "$COMPOSE_NETWORK" \
  flexile-test \
  bash -c "
    cd backend &&
    bundle exec rails db:create db:schema:load &&
    bundle exec rspec --format progress --tag ~skip --tag ~type:system
  "
