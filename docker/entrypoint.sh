#!/bin/sh
set -e

# Run from the backend workspace so Prisma and relative paths resolve correctly.
cd /app/backend

# Runs both schema (prisma migrate deploy) and data migrations. Single source of
# truth so this path stays in sync with the compose `migrate` service.
echo "==> Applying migrations"
npm run migrate

echo "==> Starting server"
exec node build/entry.cjs
