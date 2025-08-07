#!/bin/bash

set -euo pipefail

# Get the current branch name from Buildkite
CURRENT_BRANCH="${BUILDKITE_BRANCH:-$(git branch --show-current)}"
echo "🔄 Current branch: $CURRENT_BRANCH"

# Exit if we're already on a ci/ branch
if [[ "$CURRENT_BRANCH" == ci/* ]]; then
  echo "⚠️  Already on a CI branch: $CURRENT_BRANCH"
  echo "Skipping push to avoid infinite loops"
  exit 0
fi

# Create the CI branch name
# Replace slashes with hyphens and generate random hex (6 characters)
BRANCH_NAME_SAFE=$(echo "$CURRENT_BRANCH" | tr '/' '-')
RANDOM_HEX=$(openssl rand -hex 3)
CI_BRANCH="ci/$BRANCH_NAME_SAFE-$RANDOM_HEX"

echo "🔄 Current branch: $CURRENT_BRANCH"
echo "🎯 Target CI branch: $CI_BRANCH"

# Ensure we have the latest changes
echo "📥 Fetching latest changes..."
git fetch origin

# Determine what to push (use HEAD if local branch doesn't exist)
if git show-ref --verify --quiet "refs/heads/$CURRENT_BRANCH"; then
  SOURCE_REF="$CURRENT_BRANCH"
  echo "📍 Using local branch: $SOURCE_REF"
else
  SOURCE_REF="HEAD"
  echo "📍 Using HEAD (detached or missing local branch)"
fi

# Check if the CI branch already exists remotely
if git show-ref --verify --quiet "refs/remotes/origin/$CI_BRANCH"; then
  echo "⚠️  CI branch $CI_BRANCH already exists remotely"
  echo "🔄 Force pushing current commit to existing CI branch..."
  git push origin "$SOURCE_REF:refs/heads/$CI_BRANCH" --force
else
  echo "🆕 Creating new CI branch: $CI_BRANCH"
  git push origin "$SOURCE_REF:refs/heads/$CI_BRANCH"
fi

echo "✅ Successfully pushed $CURRENT_BRANCH to $CI_BRANCH"
