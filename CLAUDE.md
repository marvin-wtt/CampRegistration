# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CampRegistration is a full-stack web application for managing youth camp registrations — forms, participants, room assignments, email notifications, and multi-language content.

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
npm run test --workspace e2e                         # Start backend + run Playwright
npm run dev --workspace e2e                       # Playwright interactive UI
```

## Local Services (Docker)

```bash
docker-compose -f backend/docker-compose.yml --profile dev up -d
```

Starts: MariaDB 10.11 (port 3306), Redis 7 (port 6379), MailDev (web: 1080, SMTP: 1025), PhpMyAdmin (port 8080).

Integration tests use a separate DB on port 3307 and run serially (`maxWorkers: 1`).

## Backend Architecture

### Module System

Each feature is an `AppModule`; all lifecycle hooks are optional and called during boot:

```ts
class ExampleModule implements AppModule {
  bindContainers(options: BindOptions): void {
    /* DI bindings */
  }
  configure(options: ModuleOptions): void {
    /* middleware */
  }
  registerRoutes(router: AppRouter): void {
    /* mount router */
  }

  registerPermissions(): ScopedPermissions {
    /* RBAC, keyed by scope: { camp?, newsletter?, organization? } */
  }

  registerScopeResolvers(): ScopeResolvers {
    /* how a request becomes a permission set, for scopes this module owns */
  }
  registerJobs(scheduler: JobScheduler): void {
    /* recurring cron jobs */
  }
  shutdown(): Promise<void> | void {
    /* cleanup on shutdown */
  }
}
```

### Dependency Injection (InversifyJS)

- Services must be decorated with `@injectable()`
- Inject via constructor: `@inject(TYPES.ServiceName)`
- All bindings are singletons
- Symbols defined in `src/container/types.ts`

### Request Flow

```
Request → Router → Controller → Service (business logic) → Prisma → Response
```

- Use `Zod` for complex data shapes (JSON columns, form definitions)
- Extend `ModuleRouter` for all routers; use model binding for route params (`:campId` → `Camp` entity)
- In controllers, prefer the bound model's `.id` (e.g. `req.modelOrFail('camp').id`) over the raw route param (`req.params.campId`) for service calls and realtime emits — the binding already fetched and validated the entity, so there's no cost to using it, and it's the only option for guard-derived bindings that have no route param at all
- Throw `ApiError` from services; centralized error middleware handles the response
- Use RBAC permission guards — never write ad-hoc role comparisons

### Database

- **Prisma** with MySQL/MariaDB; schema in `backend/prisma/schema.prisma`
- Primary keys are **ULID strings** (26 chars), never integers
- Multilingual fields stored as **JSON columns**
- After changing `schema.prisma`, run `prisma migrate dev`. Never edit a migration that has already been applied;
  hand-written backfill SQL added with `--create-only` _before_
  the first apply is fine, and is sometimes the only option — **data migrations (`migration.ts`) run only after
  `prisma migrate deploy` has applied every schema migration**, so a column cannot be backfilled by one and made
  `NOT NULL` by another in the same release
- Migrations in `backend/prisma/migrations/`

### Authentication

- JWT bearer tokens; TOTP 2FA support
- System roles: `USER`, `ADMIN`
- Camp-scoped roles: `DIRECTOR`, `COORDINATOR`, `COUNSELOR`, `VIEWER`
- Newsletter-scoped roles: `OWNER`, `EDITOR`, `VIEWER`
- Organization-scoped roles: `ADMIN`, `MEMBER` (a permission scope of its own, unrelated to the system role)

### Permission scopes

Permissions are scoped RBAC. All three scopes — `camp`, `newsletter`,
`organization` — run through **one** generic mechanism, declared in
`common/src/permissions/scopes.ts`:

```ts
export interface PermissionScopes {
  camp: { role: CampManagerRole; permission: CampScopedPermission };
  newsletter: { role: NewsletterManagerRole; permission: NewsletterPermission };
  organization: { role: OrganizationRole; permission: OrganizationPermission };
}
```

- **Declare**: a module returns its grants from `registerPermissions()`, keyed by scope. `boot.ts` merges them into the
  single `permissionRegistry`
  (`permissionRegistry.for('camp').getPermissions(role)`). Registration is additive, so no one file holds the whole
  policy — `tests/unit/core/permission-registry.test.ts`
  snapshots the assembled result.
- **Guard**: `scoped(scope, permission)` (`#core/permission.guard`) reads the bound model named by the scope's
  `ScopeResolver` and asks it for the user's permission set. `campManager(p)`, `newsletterManager(p)` and
  `organizationMember(p)` are one-line aliases of it. The owning module declares its resolver by returning it from
  `registerScopeResolvers()`; `boot.ts` registers each one and then calls `assertScopeResolversComplete()`, so a scope
  left unwired fails the boot instead of 500-ing on the first guarded request. Exactly one module owns a scope —
  registering a second resolver for it throws. Both the resolver and its alias live in the **subject** module's guard
  file, named after the scope's bound model (`camp/camp.guard.ts`, `newsletter/newsletter.guard.ts`,
  `organization/organization.guard.ts`) — not in the membership module whose service they call. Guards over a membership
  _record_ (`campManagerSelf`, `campManagerSubscriber`) stay with that record's module.
- **Resolve once per scope**: `CampManagerService.getManagerAuthorization`,
  `NewsletterManagerService.getManagerPermissions` and
  `OrganizationMemberService.getMemberPermissions` are the only places their scope's permissions are computed; the
  guard, the profile resource and (for camps) the SSE subscriber all go through them.
- **Type safety**: use `ScopePermission<'camp'>` (or `CampScopedPermission`) for camp-only APIs. `Permission` is the
  union of all three scopes — passing an organization string to a camp API must be a compile error, not a silent
  `false`.
- **Adding a permission**: add the string to its union in
  `common/src/permissions/permissions.ts`, rebuild `common`, return it from the owning module's `registerPermissions()`,
  guard the route, and update the registry snapshot. The role-permission dialog needs no edit — it renders
  `GET /permissions`.
- **Never hardcode the matrix in the frontend.** `GET /permissions` serves
  `permissionRegistry.toMatrix()`; `usePermissionMatrix(scope)` consumes it.

State and ownership rules (`registrationOpen`, `campOrganizationVerified`,
`campManagerSelf`, `organizationMemberSelf`, `buildCampWhere`, `file.guard.ts`)
are deliberately **not** permissions — they stay plain `GuardFn`s composed with
`or`/`and`.

### Email

- MJML templates in `backend/src/views/emails/`
- Use `Mailable` pattern; register in the mailable registry
- Dev email preview: http://localhost:1080 (MailDev)

### Background Jobs & Queues

Two distinct systems, both wired through the module lifecycle:

**Async work queues** (`src/core/queue/`) — for deferred/retried unit-of-work jobs
(e.g. sending mail, processing file uploads).

- `Queue` is an abstract base with three interchangeable drivers selected by the
  `QUEUE_DRIVER` env var: `database` (default, backed by the Prisma `Job` model),
  `redis` (BullMQ), and `memory` (in-process, for tests).
- Inject `QueueManager` and call `queueManager.create<Payload, Result>('name', options)`
  in a service constructor, then `.process(handler)` to consume and `.add(name, payload, opts)`
  to enqueue. `QueueManager` keeps every queue as a singleton and closes them on shutdown.
- Queue options cover `maxAttempts`, `retryDelay`/`retryDelayType`, rate `limit`,
  stalled-job handling, and `repeat` (cron/interval). Job options: `delay`, `priority`.
- Admin queue inspection/retry lives in `src/app/queue/` (`/admin/queues` routes).

**Recurring scheduler** (`src/core/scheduler/JobScheduler.ts`) — for cron-style
recurring tasks (e.g. token cleanup, pruning old job records).

- Wraps `croner`. Modules register jobs in the `registerJobs(scheduler)` hook:
  `scheduler.schedule('job-name', '0 3 * * *', () => resolve(Service).method())`.
- Registration is idempotent (duplicate names ignored); the scheduler owns job
  lifecycle logging and is stopped deterministically on shutdown.

### Organizations

Camps and newsletters are owned by an `Organization`, moderated by system administrators — full design in
`docs/organizations.md`. Roles are `ADMIN`/`MEMBER`, resolved through the
`organization` permission scope (see [Permission scopes](#permission-scopes)).

- `organizationId` is **required** on `POST /camps` and `POST /newsletters`; there is no server-side default. The id
  arrives in the body and guards run before validation, so
  `organizationFromBody()` binds it as the `organization` model ahead of
  `guard(organizationMember(…))`.
- An unverified organization may build camps and newsletters freely, publication settings included — reach is **gated at
  the outward-facing action**, never at write time. The gates are
  `buildCampWhere` (public listing), the camp `show` route guard, `registrationOpen`
  combined with `campOrganizationVerified` (registrations), and
  `newsletterOrganizationVerified` (sending newsletter messages). Management UI reads
  `Camp.organizationVerificationStatus` / `Newsletter.organizationVerificationStatus` to explain why a camp isn't
  reaching anyone or why sending is disabled.
- Organization `ADMIN`s hold exactly `ORGANIZATION_CAMP_PERMISSIONS`
  (`camp.view`, `camp.edit`, `camp.managers.view`) on every camp their organization owns, merged in
  `CampManagerService.getManagerAuthorization()`, and exactly `ORGANIZATION_NEWSLETTER_PERMISSIONS`
  (`newsletter.view`, `newsletter.managers.view`) on every newsletter it owns, merged in
  `NewsletterManagerService.getManagerPermissions()`. **Never extend either constant to personal data** — registrations
  for camps, subscribers for newsletters — nor to `newsletter.messages.*`; tests assert both sets' exact contents.
- Those implicit grants carry no manager record, so the owning entities never appear under
  `GET /camps?view=assigned` or `GET /newsletters`. `GET /organizations/:id/camps` and
  `GET /organizations/:id/newsletters` exist to make them reachable — add the matching listing whenever a new implicit
  grant is introduced, or the permission is unreachable outside a direct link.

### Realtime (SSE live updates)

Permission-filtered, invalidation-only SSE — full design in
`docs/live-updates-plan.md`. One stream per camp
(`GET /camps/:campId/events`); events carry `{resource, id, operation}` plus a
`requiredPermission` that the stream handler enforces per subscriber; clients
refetch via REST (single auth path). Echo suppression: the `X-Client-Id` header
is stored in the ambient request context (`core/context/requestContext.ts`,
AsyncLocalStorage) and stamped onto `event.origin` by `RealtimeService` itself.

Adding realtime to a module (no routing/stream changes needed):

1. `common/src/realtime/events.ts`: add the resource to `RealtimeResource` +
   `RESOURCE_VIEW_PERMISSION`; rebuild `common`.
2. Backend: inject `RealtimeService` into the **controller** and call
   `void realtimeService.emit(campId, '<resource>', id, op)` after each write
   (`emitInvalidation(campId, '<resource>')` for bulk operations) — fire-and-forget
   (`void`, not `await`): errors are swallowed internally, so awaiting would only
   add latency. Emits live exclusively in controllers — never inject
   `RealtimeService` into services. Source `campId`/`id` from the bound model
   (`req.modelOrFail('camp').id`, the service's returned entity) rather than
   the raw route param — see the model binding note above.
3. Frontend: call `useRealtimeCollection('<resource>', { data, invalidate, reload, fetchOne? })`
   (`src/composables/realtimeCollection.ts`) in the feature store or page —
   it handles refetch coalescing, ordering, and reconnect reloads.

Driver: `REALTIME_DRIVER` env (`redis`/`memory`); defaults to `redis` only when
`QUEUE_DRIVER=redis`. Multi-instance deploys on other queue drivers must set
`REALTIME_DRIVER=redis`.

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

### MD3 Styling (Material Design 3 Expressive)

The frontend is themed with **`@anoyomoose/q2-fresh-paint-md3e`**, a Quasar app
extension that restyles the standard Quasar components to MD3 Expressive and adds
a few MD3-specific components. It is wired up in `frontend/quasar.config.ts`:

- The `md3e/boot` boot file and the `freshPaint({ themes: [md3eTheme(...)] })` Vite
  plugin generate the theme from a single `sourceColor` seed (`tonalSpot` scheme).
- A `prefer-color-scheme`-driven light/dark theme is generated automatically;
  Quasar's `dark: 'auto'` follows it. **Do not hardcode light/dark colors** — use
  tokens so both modes work.

**Design tokens — use `var(--md3-*)` for all colors.** Most existing custom CSS
already does this. The full token set lives in the package's `dist/theme/base.scss`;
common families:

- **Color roles**: `--md3-primary`, `--md3-on-primary`, `--md3-primary-container`,
  `--md3-on-primary-container` (and the same for `secondary`, `tertiary`, `error`,
  `warning`, `positive`, `info`).
- **Surfaces**: `--md3-surface`, `--md3-surface-container-lowest|low|/-high|-highest`,
  `--md3-surface-variant`, `--md3-background`, `--md3-on-surface`,
  `--md3-on-surface-variant`, `--md3-outline`, `--md3-outline-variant`.
- **RGB triplets** (for `rgba(...)`): e.g. `--md3-primary-rgb`, `--md3-surface-rgb`.
- Each color token also has explicit `--md3-<role>--light` / `--md3-<role>--dark`
  variants; the un-suffixed name is the auto-switching alias — prefer it.

**Utility classes** (no custom CSS needed for these):

- Shape: `.rounded-none|xs|sm|md|lg|lg-inc|xl|xl-inc|xxl|full`
- Elevation: `.elevation-0` … `.elevation-5`
- Opt-outs: `.no-morph` (disable button shape-morph on press), `.no-widening`
  (disable button-group widening). Shape tokens are also Sass vars
  (`$md3-corner-*`, `$md3-easing-*`) for use inside `<style lang="scss">`.

**MD3 components** — import from subpaths (these are _not_ auto-registered):

```ts
import { MBtn } from "@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn";
import { MToolbar } from "@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar";
// also available: Md3eBtnGroup, Md3eFab, Md3eFabAction, Md3eSlider
```

- **`<m-btn>`** — drop-in QBtn replacement. Color shortcuts (`primary`,
  `secondary`, `tertiary`, `error`) and variants (`elevated`, `tonal`, `text`).
  Supports toggle/selection via `v-model` (boolean, single-select with `value`, or
  multi-select with an array). `elevated`/`tonal`/toggle buttons only support the
  four shortcut colors; use `allow-color` + `color="…"` to bypass for others.
- **`<m-toolbar>`** — QToolbar wrapper with `floating`, `vibrant`, `vertical`,
  `surface`, `no-gap` variants. All QBtn/QToolbar props and slots pass through.
- Every styling shortcut is also a plain CSS class (`.q-btn--toggle`,
  `.q-toolbar--floating`, …), so a vanilla QBtn/QToolbar can opt in without the
  wrapper.
- Icons use standard `material-icons` names (`icon="add"`, `icon="more_vert"`),
  **not** the `sym_r_*` names shown in the package's own JSDoc examples.

**SurveyJS theming**: `frontend/src/lib/surveyJs/themes/md3.ts` maps the same MD3
tokens onto SurveyJS. `varResolver` emits live `var(--md3-*)` references for
rendered surveys; `createStaticResolver()` (in `md3-creator.ts`) bakes computed
literals for the SurveyJS theme editor, which can't parse `var()`/`color-mix()`.

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
   column needs data, since `prisma/data-migrations/runner.ts` runs after _all_ schema migrations of a deploy
4. **i18n**: add translation keys to all 5 locale files
5. **Type imports**: use `import type` for type-only imports (ESLint enforced)
6. **InversifyJS**: every new service needs `@injectable()` and registration in `bindContainers`
7. **Permissions**: use RBAC guards, not manual role checks
8. **Organizations**: camps and newsletters need an `organizationId`; an unverified org's camps are hidden and refuse
   registrations and its newsletters refuse to send, but that is gated at the outward-facing action — don't add
   write-time publication gates. Org `ADMIN`s hold only
   `ORGANIZATION_CAMP_PERMISSIONS` on their org's camps and `ORGANIZATION_NEWSLETTER_PERMISSIONS` on its newsletters —
   never registrations, never subscribers
9. **MD3 colors**: style with `var(--md3-*)` tokens (never hardcoded hex/light-dark colors); use `<m-btn>`/`<m-toolbar>`
   and `.rounded-*`/`.elevation-*` utilities. Don't edit the patched `@anoyomoose/q2-fresh-paint-md3e` in `node_modules`
