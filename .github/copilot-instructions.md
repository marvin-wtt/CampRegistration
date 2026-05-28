# Copilot Instructions for CampRegistration

## Project Overview

CampRegistration is a full-stack web application for managing youth camp registrations. It provides camp organizers with tools to create registration forms, manage participants, assign rooms and beds, send email notifications, and handle multi-language content.

## Repository Structure

This is an **npm workspaces monorepo** with the following workspaces:

- **`backend/`** – Node.js/Express REST API
- **`frontend/`** – Vue 3/Quasar SPA
- **`common/`** – Shared TypeScript types, entities, form definitions, and permissions
- **`e2e/`** – Cypress end-to-end tests

## Technology Stack

### Backend

- **Runtime**: Node.js 22–24
- **Language**: TypeScript (strict mode)
- **Framework**: Express 5
- **ORM**: Prisma (MySQL/MariaDB)
- **Dependency Injection**: InversifyJS
- **Queue**: BullMQ + Redis
- **Auth**: Passport.js + JWT + TOTP 2FA
- **Email**: Nodemailer + MJML templates
- **Logging**: Winston
- **Validation**: Zod
- **Testing**: Vitest (unit + integration)

### Frontend

- **Language**: TypeScript (strict mode)
- **Framework**: Vue 3 (Composition API)
- **UI**: Quasar 2
- **State**: Pinia
- **Routing**: Vue Router 4
- **i18n**: vue-i18n
- **Build**: Vite (via Quasar CLI)
- **Forms**: SurveyJS
- **Testing**: Vitest

### E2E

- Cypress 15 (Chrome + Firefox)
- cypress-maildev for email testing
- OTPlib for TOTP testing

## Development Commands

### Root (all workspaces)

```bash
npm install                          # Install all dependencies
npm run build                        # Build all workspaces
npm run lint --workspaces --if-present   # Lint all workspaces
npm run format:check --workspaces --if-present  # Check formatting
```

### Backend (`backend/`)

```bash
npm run dev --workspace backend      # Start dev server with hot reload
npm run build --workspace backend    # Compile TypeScript + Prisma generate
npm run test --workspace backend     # Run all tests (unit + integration)
npm run test:unit --workspace backend
npm run test:int --workspace backend
npm run lint --workspace backend
npm run format --workspace backend
npm run db:migrate --workspace backend   # Apply Prisma migrations
npm run db:seed --workspace backend      # Seed database
```

### Frontend (`frontend/`)

```bash
npm run dev --workspace frontend     # Quasar dev server
npm run build --workspace frontend   # Production build
npm run test --workspace frontend    # Run unit tests (CI mode)
npm run lint --workspace frontend
npm run format --workspace frontend
```

### Common (`common/`)

```bash
npm run build --workspace common     # Must be built before backend/frontend
```

> **Important**: Always build `common` before building `backend` or `frontend`.

## Code Style & Conventions

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Trailing commas**: Yes
- **Semicolons**: Yes
- **Line endings**: Auto-detected
- **Vue**: Single attribute per line

Linting and formatting are enforced via ESLint and Prettier. Run `npm run lint:fix` and `npm run format` to auto-fix issues.

### TypeScript

- Strict mode is enabled everywhere (`noImplicitAny`, strict null checks, etc.)
- Always use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports`)
- Path alias `#*` maps to `src/*` in the backend

### Naming

- **Classes/Components**: PascalCase
- **Functions/Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Private class members**: prefix with `_` only when shadowing a public name
- **Unused variables**: prefix with `_` to suppress linting warnings

## Backend Architecture

### Module System

Each feature is an `AppModule` with four responsibilities:

```ts
class ExampleModule implements AppModule {
  bindContainers(container: Container): void { /* register DI bindings */ }
  configure(app: Application): void { /* middleware, config */ }
  registerRoutes(app: Application): void { /* mount router */ }
  registerPermissions(): void { /* define RBAC permissions */ }
}
```

### Dependency Injection (InversifyJS)

- Services are decorated with `@injectable()`
- Inject via constructor with `@inject(TYPES.ServiceName)`
- All bindings are scoped as singletons
- Symbols for each service are defined in `src/container/types.ts`

### Controller → Service → Repository Flow

```
Request → Router → Controller (validation) → Service (business logic) → Prisma (data)
```

### Routing (ModuleRouter)

- Extend `ModuleRouter` base class
- Use model binding for route parameters (e.g., `:campId` → `Camp` entity)
- Sub-routers use `mergeParams: true`

### Validation

- Use `Zod` schemas for complex data shapes (e.g., form definitions, JSON columns)

### Database (Prisma)

- Primary keys: ULID strings (not auto-increment integers)
- Multilingual fields stored as JSON columns
- Soft delete is supported on some models
- Migrations live in `backend/prisma/migrations/`; always generate migrations with `prisma migrate dev`

### Error Handling

- Throw `ApiError` instances from services
- A centralized error middleware converts them to HTTP responses
- Never swallow errors silently

### Authentication & Authorization

- JWT bearer tokens for API authentication
- Roles: `USER`, `ADMIN` (system-wide) and `DIRECTOR`, `COORDINATOR`, `COUNSELOR`, `VIEWER` (per-camp)
- Use permission guards provided by the RBAC system, not ad-hoc role checks

### Email

- Templates are MJML files in `backend/src/views/emails/`
- Use the `Mailable` pattern; register mailables in the mailable registry
- Available drivers: `smtp`, `test` (maildev), `noop`

## Frontend Architecture

### Component Organization

```
src/
  components/   # Feature-organized reusable components
  pages/        # Route-level components
  layouts/      # App shell layouts
  stores/       # Pinia stores (one per feature domain)
  services/     # API client modules
  composables/  # Vue 3 composition utilities
  utils/        # Pure helper functions
  lib/          # Third-party integrations (SurveyJS, etc.)
  i18n/         # Translation files per locale
```

### State Management (Pinia)

- One store per feature domain
- Use `storeToRefs` when destructuring reactive state
- Keep stores focused; cross-store communication via composables

### Internationalization

- Supported locales: `en`, `de`, `fr`, `cs`, `pl`
- Frontend translations live in `frontend/src/i18n/{locale}/`
- Backend translations live in `backend/src/i18n/{locale}/`
- Always add translation keys for all supported locales

### API Communication

- Services in `frontend/src/services/` wrap Axios calls
- Always type request and response bodies using types from `common/`
- Handle loading, error, and success states in stores or composables

## Testing Guidelines

### Unit Tests

- Use **Vitest** for both backend and frontend unit tests
- Mock dependencies with `vitest-mock-extended`
- Test files live next to source files (`*.spec.ts`) or in a `tests/` directory
- Aim for pure unit tests; avoid real I/O in unit tests

### Integration Tests (Backend)

- Use a real MariaDB + Redis instance (see CI config for env vars)
- Tests live in `backend/tests/`
- Run migrations before the test suite

### E2E Tests (Cypress)

- Tests live in `e2e/cypress/`
- Run against a fully started backend + frontend
- Use `cypress-maildev` for email assertions
- Use `otplib` for TOTP code generation in auth flows
- Prefer `data-cy` attributes for element selectors; avoid CSS class selectors

## CI/CD

### Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `test.yml` | Push to `main`, PRs | verify-migrations, test-backend (Node 22 & 24), test-frontend, test-e2e (Chrome + Firefox) |
| `style.yml` | PRs | lint, format |

### PR Requirements

- All tests must pass
- ESLint must pass (`npm run lint`)
- Prettier must pass (`npm run format:check`)
- Draft PRs skip CI

## Common Pitfalls

1. **Build order**: `common` must be built before `backend` or `frontend`.
2. **Prisma**: After changing `schema.prisma`, run `prisma migrate dev` to generate a migration; never edit migration SQL manually.
3. **ULID keys**: Do not use integer IDs — all primary keys are ULIDs.
4. **i18n**: Every user-facing string must be added to all locale files.
5. **Type imports**: Use `import type` for type-only imports to satisfy the ESLint rule.
6. **InversifyJS decorators**: Services must be decorated with `@injectable()` and registered in the module's `bindContainers`.
7. **Permission checks**: Use the built-in RBAC guards rather than manual role comparisons.
