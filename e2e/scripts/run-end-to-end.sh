#!/usr/bin/env bash

# Read .env file
DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/setenv.sh

# Start docker container
docker-compose up -d
echo '🟡 - Waiting for database to be ready...'
sleep 1
host_port=$(echo "$DATABASE_URL" | sed -E 's/^[^@]+@([^/]+)\/.*/\1/')
if ! $DIR/wait-for-it.sh "${host_port}"  --strict -- echo '🟢 - Database is ready!'; then
  echo '🔴 - Database is not ready. Exiting...'
  exit 1
fi

if ! npm run db:reset -w ../backend; then
  echo '🔴 - Resetting database failed. Exiting...'
  exit 1
fi

# Start test
npm run dev:run
