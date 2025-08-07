#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NO_COLOR='\033[0m'

# Get the current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Exit if we're already on a ci/ branch
if [[ "$CURRENT_BRANCH" == ci/* ]]; then
  echo -e "${YELLOW}⚠️  Already on a CI branch: $CURRENT_BRANCH${NO_COLOR}"
  echo -e "${YELLOW}Skipping push to avoid infinite loops${NO_COLOR}"
  exit 0
fi

# Create the CI branch name
# Replace slashes with hyphens and generate random hex (6 characters)
BRANCH_NAME_SAFE=$(echo "$CURRENT_BRANCH" | tr '/' '-')
RANDOM_HEX=$(openssl rand -hex 3)
CI_BRANCH="ci/$BRANCH_NAME_SAFE-$RANDOM_HEX"

echo -e "${BLUE}🔄 Current branch: $CURRENT_BRANCH${NO_COLOR}"
echo -e "${BLUE}🎯 Target CI branch: $CI_BRANCH${NO_COLOR}"

# Ensure we have the latest changes
echo -e "${YELLOW}📥 Fetching latest changes...${NO_COLOR}"
git fetch origin

# Check if the CI branch already exists remotely
if git show-ref --verify --quiet "refs/remotes/origin/$CI_BRANCH"; then
  echo -e "${YELLOW}⚠️  CI branch $CI_BRANCH already exists remotely${NO_COLOR}"
  echo -e "${YELLOW}🔄 Force pushing current branch to existing CI branch...${NO_COLOR}"
  git push origin "$CURRENT_BRANCH:$CI_BRANCH" --force
else
  echo -e "${GREEN}🆕 Creating new CI branch: $CI_BRANCH${NO_COLOR}"
  git push origin "$CURRENT_BRANCH:$CI_BRANCH"
fi

echo -e "${GREEN}✅ Successfully pushed $CURRENT_BRANCH to $CI_BRANCH${NO_COLOR}"
