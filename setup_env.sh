#!/usr/bin/env bash

# Simple setup script for SituationSort
set -e

printf '\n\033[1mSetting up SituationSort...\033[0m\n\n'

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Please install Node.js 20 or later." >&2
  exit 1
fi
printf 'Node.js %s found\n' "$(node --version)"

# Check npm
if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Please install npm." >&2
  exit 1
fi
printf 'npm %s found\n' "$(npm --version)"

# Install dependencies
printf '\nInstalling dependencies...\n'
npm install

# Run database migrations if DATABASE_URL is present
if [ -n "$DATABASE_URL" ]; then
  printf '\nApplying database schema...\n'
  if npm run db:push; then
    echo "Database setup complete"
  else
    echo "Database setup failed (continuing)" >&2
  fi
else
  echo "DATABASE_URL not set; skipping database setup"
fi

printf '\nSetup complete! Start the app with: npm run dev\n'

