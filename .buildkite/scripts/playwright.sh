#!/bin/bash
set -euo pipefail

echo "--- Running Playwright E2E tests"

# Run common setup
.buildkite/scripts/setup.sh

echo "--- Installing Chrome for Puppeteer"
pnpm puppeteer browsers install chrome

echo "--- Creating certificates"
node docker/createCertificate.js

echo "--- Building Next.js application"
NODE_ENV=test pnpm run build-next --no-lint

echo "--- Installing foreman"
gem install foreman

echo "--- Installing Playwright browsers"
pnpm playwright install --with-deps chromium

echo "--- Starting Docker services"
docker compose -f docker/docker-compose-local-linux.yml up -d

echo "--- Running Playwright tests"
pnpm playwright test

echo "✅ Playwright tests complete"