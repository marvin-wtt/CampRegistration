# syntax=docker/dockerfile:1

# Production image: builds the monorepo and runs the backend, which also serves
# the Quasar SPA. The same image runs migrations (`prisma`/`tsx` are runtime
# deps); the migrate service in compose.yaml just overrides the command.
# Build context is the repository root.

# Stage 1 — build: install, compile common -> backend -> frontend, drop dev deps.
# Full source is copied before `npm ci` so package postinstalls (quasar prepare,
# prisma engines, esbuild) have the files they need.
FROM node:22-bookworm-slim AS build

# Openssl required by prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

ENV CYPRESS_INSTALL_BINARY=0

# SurveyJS licence key is inlined into the SPA bundle at build time (see
# frontend/quasar.config.ts `defineEnv`), so it must be present here — setting
# it on the runtime container has no effect. It is not a secret: the key ships
# in the public client bundle and is domain-bound.
ARG SURVEYJS_LICENSE_KEY

COPY . .
RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

# Stage 2 — runtime.
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    APP_PORT=3000

# /data is the mounted uploads/tmp volume. The app handles SIGTERM itself, so
# no init (tini) is needed; set `init: true` in compose if you want one.
RUN mkdir -p /data/uploads /data/tmp && chown -R node:node /data

# Ship the whole pruned tree: preserves the workspace layout/symlinks and the
# Prisma client + engine without enumerating files.
COPY --from=build --chown=node:node /app /app

# Pre-create the logs dir owned by node so a fresh `logs` named volume inherits
# node ownership on first mount (same trick as /data above); otherwise Docker
# creates the mount point root-owned and the node process hits EACCES.
RUN mkdir -p /app/backend/logs && chown node:node /app/backend/logs

USER node

# Backend resolves the SPA and Prisma paths relative to this workspace.
WORKDIR /app/backend

EXPOSE 3000

# Healthy once the API answers 2xx (mounted under /api/v1).
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.APP_PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Default command starts the API; the migrate service overrides it.
CMD ["node", "build/entry.cjs"]
