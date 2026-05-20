# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CampRegistration is a full-stack web application for managing youth camp registrations — forms, participants, room assignments, email notifications, and multi-language content.

## Repository Structure

npm workspaces monorepo with four workspaces:

- **`common/`** – Shared TypeScript types, entities, form definitions, and permissions (must build first)
- **`backend/`** – Node.js/Express 5 REST API (TypeScript, Prisma, InversifyJS, BullMQ)
- **`frontend/`** – Vue 3/Quasar SPA (TypeScript, Pinia, SurveyJS, vue-i18n)
- **`e2e/`** – Cypress end-to-end tests

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

# Single test file (unit)
npx vitest tests/unit/path/to/test.ts -c vitest.config.unit.ts --workspace backend
# Single test file (integration)
npx vitest tests/integration/path/to/test.ts -c vitest.config.integration.ts --workspace backend

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
npx vitest src/path/to/test.ts --workspace frontend
```

### E2E
```bash
npm run test --workspace e2e                         # Start backend + run Cypress
npm run run:ui --workspace e2e                       # Cypress interactive UI
```

## Local Services (Docker)

```bash
docker-compose -f backend/docker-compose.yml --profile dev up -d
```

Starts: MariaDB 10.11 (port 3306), Redis 7 (port 6379), MailDev (web: 1080, SMTP: 1025), PhpMyAdmin (port 8080).

Integration tests use a separate DB on port 3307 and run serially (`maxWorkers: 1`).

## Backend Architecture

### Module System

Each feature is an `AppModule` with four responsibilities:

```ts
class ExampleModule implements AppModule {
  bindContainers(container: Container): void { /* DI bindings */ }
  configure(app: Application): void { /* middleware */ }
  registerRoutes(app: Application): void { /* mount router */ }
  registerPermissions(): void { /* RBAC permissions */ }
}
```

### Dependency Injection (InversifyJS)

- Services must be decorated with `@injectable()`
- Inject via constructor: `@inject(TYPES.ServiceName)`
- All bindings are singletons
- Symbols defined in `src/container/types.ts`

### Request Flow

```
Request → Router → Controller (express-validator) → Service (business logic) → Prisma → Response
```

- Use `express-validator` chains for HTTP input; use `Zod` for complex data shapes (JSON columns, form definitions)
- Extend `ModuleRouter` for all routers; use model binding for route params (`:campId` → `Camp` entity)
- Throw `ApiError` from services; centralized error middleware handles the response
- Use RBAC permission guards — never write ad-hoc role comparisons

### Database

- **Prisma** with MySQL/MariaDB; schema in `backend/prisma/schema.prisma`
- Primary keys are **ULID strings** (26 chars), never integers
- Multilingual fields stored as **JSON columns**
- After changing `schema.prisma`, run `prisma migrate dev` — never edit migration SQL manually
- Migrations in `backend/prisma/migrations/`

### Authentication

- JWT bearer tokens; TOTP 2FA support
- System roles: `USER`, `ADMIN`
- Camp-scoped roles: `DIRECTOR`, `COORDINATOR`, `COUNSELOR`, `VIEWER`

### Email

- MJML templates in `backend/src/views/emails/`
- Use `Mailable` pattern; register in the mailable registry
- Dev email preview: http://localhost:1080 (MailDev)

### Backend Path Alias

`#*` maps to `src/*` in backend TypeScript.

## Frontend Architecture

### State & API

- One Pinia store per feature domain; use `storeToRefs()` for destructuring reactive state
- Services in `frontend/src/services/` wrap Axios; always type bodies using `common/` types

### Internationalization

- Locales: `en`, `de`, `fr`, `cs`, `pl`
- Frontend translations: `frontend/src/i18n/{locale}/`
- Backend translations: `backend/src/i18n/{locale}/`
- Every user-facing string must be added to **all** locale files

## Testing

- **Unit tests** (backend): mock dependencies with `vitest-mock-extended`; no real I/O
- **Integration tests** (backend): require MariaDB + Redis; migrations run automatically before the suite via `tests/integration/setup.ts`
- **E2E** (Cypress): prefer `data-cy` attributes for selectors; use `cypress-maildev` for email assertions and `otplib` for TOTP code generation

## Key Pitfalls

1. **Build order**: always build `common` before `backend` or `frontend`
2. **ULID keys**: all PKs are ULID strings — never integers
3. **Prisma migrations**: use `prisma migrate dev`; never edit migration SQL directly
4. **i18n**: add translation keys to all 5 locale files
5. **Type imports**: use `import type` for type-only imports (ESLint enforced)
6. **InversifyJS**: every new service needs `@injectable()` and registration in `bindContainers`
7. **Permissions**: use RBAC guards, not manual role checks