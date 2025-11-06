#!/usr/bin/env bash

# Read .env file
DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/setenv.sh

# Start docker container
docker-compose --profile test -p app_test up -d
echo '🟡 - Waiting for database to be ready...'
sleep 1
host_port=$(echo "$DATABASE_URL" | sed -E 's/^[^@]+@([^/]+)\/.*/\1/')
if ! $DIR/wait-for-it.sh "${host_port}"  --strict -- echo '🟢 - Database is ready!'; then
  echo '🔴 - Database is not ready. Exiting...'
  exit 1
fi

if ! npx prisma db push --force-reset --accept-data-loss; then
  echo '🔴 - Resetting database failed. Exiting...'
  exit 1
fi

# Start test
if [ "$#" -eq  "0" ]
  then
    vitest -c ./vitest.config.integration.ts
else
    vitest -c ./vitest.config.integration.ts "$@"
fi
