#!/bin/bash
set -euo pipefail

echo "--- Setting up build environment"

# Install Node.js via nvm if not available
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install $(cat .node-version)
  nvm use $(cat .node-version)
fi

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

# Install dependencies
echo "Installing pnpm dependencies..."
pnpm i

# Setup environment files
echo "Setting up environment files..."
cp .env.example .env
ln -sf $PWD/.env ./frontend/.env

# Install Ruby dependencies via bundler
echo "Installing Ruby dependencies..."
cd backend
bundle install
cd ..

echo "✅ Build environment setup complete"