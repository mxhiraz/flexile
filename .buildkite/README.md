# Buildkite Pipeline Configuration

This directory contains the Buildkite pipeline configuration and scripts that replace the GitHub Actions workflows.

## Files

### Pipeline Configuration

- `pipeline.yml` - Main Buildkite pipeline configuration
- `docker-compose.yml` - Docker services for running tests
- `Dockerfile` - Container image for running builds

### Scripts

- `scripts/setup.sh` - Common build environment setup
- `scripts/autofix.sh` - Autofix workflow (linting and formatting)
- `scripts/rspec.sh` - RSpec test runner with Knapsack Pro
- `scripts/playwright.sh` - Playwright E2E test runner

## Migration from GitHub Actions

The following GitHub Actions workflows have been migrated:

### 1. Autofix Workflow (`.github/workflows/autofix.yml`)

- **Trigger**: Pull requests (opened, synchronize, reopened)
- **Buildkite equivalent**: `autofix` group
- **Changes**:
  - Autofix-ci action needs manual implementation
  - Runs on pull request branches only

### 2. Tests Workflow (`.github/workflows/tests.yml`)

- **Trigger**: All pushes
- **Buildkite equivalent**: `tests` group with `rspec` and `playwright` steps
- **Changes**:
  - Matrix builds for RSpec parallelization
  - Docker services for PostgreSQL and Redis
  - Artifact collection for Playwright reports

## Environment Variables

The following environment variables need to be configured in Buildkite:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `WISE_API_KEY`
- `WISE_PROFILE_ID`
- `KNAPSACK_PRO_TEST_SUITE_TOKEN_RSPEC`

## Setup Instructions

1. Install the Buildkite agent on your infrastructure
2. Configure the environment variables in Buildkite
3. Upload the pipeline configuration:
   ```bash
   buildkite-agent pipeline upload .buildkite/pipeline.yml
   ```

## Notes

- The autofix step requires manual implementation of autofix tooling
- Caching strategies may need adjustment based on Buildkite agent setup
- Docker-in-Docker may require additional configuration depending on your agent setup
