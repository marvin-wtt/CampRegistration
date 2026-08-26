# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CampRegistration is a full-stack web application for managing event registrations — camps, seminars, workshops, and similar events — covering forms, participants, room assignments, email notifications, and multi-language content.

## Repository Structure

npm workspaces monorepo with four workspaces:

- **`common/`** – Shared TypeScript types, entities, form definitions, and permissions (must build first)
- **`backend/`** – Node.js/Express 5 REST API (TypeScript, Prisma, InversifyJS, driver-based queues, croner scheduler)
- **`frontend/`** – Vue 3/Quasar SPA (TypeScript, Pinia, SurveyJS, vue-i18n)
- **`e2e/`** – Playwright end-to-end tests (desktop + mobile device projects)

## Commands

### Root

```bash
npm install
npm run build                                        # Build all workspaces
npm run lint --workspaces --if-present
npm run format:check --workspaces --if-present
```

### Backend

```bash
npm run dev --workspace backend                      # Dev server with hot reload
npm run build --workspace backend
npm run test --workspace backend                     # Unit + integration tests
npm run test:unit --workspace backend
npm run test:int --workspace backend
npm run lint --workspace backend
npm run format --workspace backend

# Single test file (unit) — `--` forwards the path to vitest, `run` disables watch mode
npm run test:unit --workspace backend -- run tests/unit/path/to/test.ts
# Single test file (integration)
npm run test:int --workspace backend -- run tests/integration/path/to/test.ts

# Database
npm run db:migrate --workspace backend               # Apply Prisma migrations
npm run db:seed --workspace backend
npm run db:reset --workspace backend                 # DESTRUCTIVE — drops and recreates
npm run db:studio --workspace backend                # Prisma Studio GUI
```

### Frontend

```bash
npm run dev --workspace frontend                     # Quasar dev server
npm run build --workspace frontend
npm run test --workspace frontend                    # CI mode
npm run test:unit --workspace frontend               # Watch mode
npm run lint --workspace frontend
npm run format --workspace frontend

# Single test file
npm run test:unit --workspace frontend -- run src/path/to/test.ts
```

### E2E

```bash
npm run test --workspace e2e                         # Start backend + run Playwright
npm run dev --workspace e2e                       # Playwright interactive UI
```

### Verification

Prefer the WebStorm MCP tools over shelling out: `mcp__webstorm__get_file_problems`
for inspections/type errors on a file you just changed, `mcp__webstorm__lint_files`
for ESLint. Reach for `npm run lint`/`typecheck` when checking a whole workspace,
or when the IDE isn't connected.

Before opening a PR, `/verify` runs the same gates CI does.

## Local Services (Docker)

```bash
docker-compose -f backend/docker-compose.yml --profile dev up -d
```

Starts: MariaDB 10.11 (port 3306), Redis 7 (port 6379), MailDev (web: 1080, SMTP: 1025), PhpMyAdmin (port 8080).

Integration tests use a separate DB on port 3307 and run serially (`maxWorkers: 1`).

## Architecture

Detailed conventions live next to the code they govern and load when a file there
is opened. Read the relevant one before changing that workspace:

- **`backend/CLAUDE.md`** — modules & DI, request flow, database, auth, permission
  scopes, email, queues & scheduler, organizations, realtime (SSE), the `#*` alias
- **`frontend/CLAUDE.md`** — Pinia/API conventions, i18n, MD3 styling and tokens
- **`docs/organizations.md`** and **`docs/live-updates-plan.md`** — the full designs
- **`backend/prisma/data-migrations/README.md`** — the data migration runner

### Skills

Multi-step procedures are packaged as skills — invoke them instead of
reconstructing the steps:

- **`add-permission`** — a new scoped RBAC permission, end to end
- **`add-realtime-resource`** — wiring a resource into the SSE stream
- **`prisma-migration`** — schema changes, backfills, and data migrations

### Hooks

`.claude/hooks/` runs on every session: Prettier after each write, an i18n
completeness check after touching translations, and approval prompts before
destructive commands or edits under `prisma/migrations/`.

## Testing

- **Unit tests** (backend): mock dependencies with `vitest-mock-extended`; no real I/O
- **Integration tests** (backend): require MariaDB + Redis; migrations run automatically before the suite via `tests/integration/setup.ts`
- **E2E** (Playwright): prefer `data-test` attributes for selectors (`page.getByTestId()`); use `support/maildev.ts` (
  MailDev REST API) for email assertions and `otplib` for TOTP code generation; suite runs `workers: 1` against a shared
  database, truncated/reseeded per test; desktop (Chromium/Firefox/WebKit) and mobile (Pixel 7/iPhone 14) device
  projects defined in `e2e/playwright.config.ts`

## Key Pitfalls

1. **Build order**: always build `common` before `backend` or `frontend`
2. **ULID keys**: all PKs are ULID strings — never integers
3. **Prisma migrations**: use `prisma migrate dev`; never edit a migration that has already been applied. Hand-written
   backfill SQL added with `--create-only` before the first apply is fine — and is the only option when a `NOT NULL`
   column needs data, since `prisma/data-migrations/runner.ts` runs after _all_ schema migrations of a deploy (skill:
   `prisma-migration`)
4. **i18n**: add translation keys to all 5 locale files
5. **Type imports**: use `import type` for type-only imports (ESLint enforced)
6. **InversifyJS**: every new service needs `@injectable()` and registration in `bindContainers`
7. **Permissions**: use RBAC guards, not manual role checks (skill: `add-permission`)
8. **Organizations**: events and newsletters need an `organizationId`; an unverified org's events are hidden and refuse
   registrations and its newsletters refuse to send, but that is gated at the outward-facing action — don't add
   write-time publication gates. Org `ADMIN`s hold only
   `ORGANIZATION_EVENT_PERMISSIONS` on their org's events and `ORGANIZATION_NEWSLETTER_PERMISSIONS` on its newsletters —
   never registrations, never subscribers
9. **MD3 colors**: style with `var(--md3-*)` tokens (never hardcoded hex/light-dark colors); use `<m-btn>`/`<m-toolbar>`
   and `.rounded-*`/`.elevation-*` utilities. Don't edit the patched `@anoyomoose/q2-fresh-paint-md3e` in `node_modules`
