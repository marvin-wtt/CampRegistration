#!/bin/sh
set -e

# Run from the backend workspace so Prisma and relative paths resolve correctly.
cd /app/backend

echo "==> Applying schema migrations (prisma migrate deploy)"
npm run db:migrate

echo "==> Applying data migrations"
npm run data:migrate

echo "==> Starting server"
exec node build/entry.cjs
