# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Builder: install all workspaces and build common -> backend -> frontend.
# Build context is the repository root.
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

# Toolchain for any native dependencies built during `npm ci`.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
COPY common/package.json ./common/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY e2e/package.json ./e2e/
RUN npm ci

# Copy the rest of the sources and build in dependency order.
COPY . .
RUN npm run build --workspace common \
  && npm run build --workspace backend \
  && npm run build --workspace frontend

# Drop devDependencies so the runtime image only ships what production needs.
# The migration step needs these at runtime, so they are declared as runtime
# dependencies (in backend/package.json) and survive the prune:
#   - `prisma`               CLI for `migrate deploy`
#   - `tsx`                  runs the data-migration runner from TS source
#   - `@prisma/adapter-mariadb`  DB driver used by the runner
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# Runtime: slim image running the compiled backend, which also serves the SPA.
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV APP_PORT=8000

WORKDIR /app

# Copy the pruned, built workspace. The backend resolves the SPA at
# ../frontend/dist/spa and email views at backend/build/views, so the monorepo
# layout must be preserved.
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/common ./common
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/tsconfig.json ./backend/tsconfig.json
COPY --from=builder /app/backend/prisma.config.ts ./backend/prisma.config.ts
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/build ./backend/build
COPY --from=builder /app/backend/node_modules ./backend/node_modules
# Data migrations run via tsx from source, which resolves `#generated/*` to the
# generated Prisma client under src/generated.
COPY --from=builder /app/backend/src/generated ./backend/src/generated

COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh

WORKDIR /app/backend

EXPOSE 8000

# Container is healthy once the API answers. Path is mounted under /api/v1.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.APP_PORT||8000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker/entrypoint.sh"]
