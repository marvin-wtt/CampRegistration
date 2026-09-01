#!/usr/bin/env bash
# Container-side half of `npm run update-snapshots --workspace e2e`; runs in the
# `snapshots` service defined in e2e/docker-compose.yml. Installs, builds and
# captures the visual baselines onto the bind-mounted working tree. Any
# arguments are forwarded to Playwright.
#
# The database schema is provisioned by the suite's own globalSetup
# (`prisma db push --force-reset`), so no migration step is needed here.
set -euo pipefail

# Skip `npm ci` while the lockfile is unchanged from the cached volume.
lock_hash="$(sha256sum package-lock.json | cut -d' ' -f1)"
if [ "$(cat node_modules/.snapshot-lock-hash 2>/dev/null)" != "$lock_hash" ]; then
  npm ci --no-audit --no-fund
  echo "$lock_hash" >node_modules/.snapshot-lock-hash
fi

npm run build

cd e2e
npx playwright test visual.spec \
  --project=chromium \
  --project=mobile-chrome \
  --update-snapshots "$@"

echo "Done. Updated baselines are in e2e/tests/**/*-snapshots/."
