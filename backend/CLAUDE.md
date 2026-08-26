# CLAUDE.md — backend/

Backend-specific conventions. The repo-wide overview, commands, and pitfalls live in the root `CLAUDE.md`.

## Module System

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
    /* RBAC, keyed by scope: { event?, newsletter?, organization? } */
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

## Dependency Injection (InversifyJS)

- Services must be decorated with `@injectable()`
- Inject via constructor: `@inject(TYPES.ServiceName)`
- All bindings are singletons
- Symbols defined in `src/container/types.ts`

## Request Flow

```
Request → Router → Controller → Service (business logic) → Prisma → Response
```

- Use `Zod` for complex data shapes (JSON columns, form definitions)
- Extend `ModuleRouter` for all routers; use model binding for route params (`:eventId` → `Event` entity)
- In controllers, prefer the bound model's `.id` (e.g. `req.modelOrFail('event').id`) over the raw route param (`req.params.eventId`) for service calls and realtime emits — the binding already fetched and validated the entity, so there's no cost to using it, and it's the only option for guard-derived bindings that have no route param at all
- Throw `ApiError` from services; centralized error middleware handles the response
- Use RBAC permission guards — never write ad-hoc role comparisons

## Database

- **Prisma** with MySQL/MariaDB; schema in `backend/prisma/schema.prisma`
- Primary keys are **ULID strings** (26 chars), never integers
- Multilingual fields stored as **JSON columns**
- After changing `schema.prisma`, run `prisma migrate dev`. Never edit a migration that has already been applied;
  hand-written backfill SQL added with `--create-only` _before_
  the first apply is fine, and is sometimes the only option — **data migrations (`migration.ts`) run only after
  `prisma migrate deploy` has applied every schema migration**, so a column cannot be backfilled by one and made
  `NOT NULL` by another in the same release
- Migrations in `backend/prisma/migrations/`

## Authentication

- JWT bearer tokens; TOTP 2FA support
- System roles: `USER`, `ADMIN`
- Event-scoped roles: `DIRECTOR`, `COORDINATOR`, `COUNSELOR`, `VIEWER`
- Newsletter-scoped roles: `OWNER`, `EDITOR`, `VIEWER`
- Organization-scoped roles: `ADMIN`, `MEMBER` (a permission scope of its own, unrelated to the system role)

## Permission scopes

Permissions are scoped RBAC. All three scopes — `event`, `newsletter`,
`organization` — run through **one** generic mechanism, declared in
`common/src/permissions/scopes.ts`:

```ts
export interface PermissionScopes {
  event: { role: EventManagerRole; permission: EventScopedPermission };
  newsletter: { role: NewsletterManagerRole; permission: NewsletterPermission };
  organization: { role: OrganizationRole; permission: OrganizationPermission };
}
```

- **Declare**: a module returns its grants from `registerPermissions()`, keyed by scope. `boot.ts` merges them into the
  single `permissionRegistry`
  (`permissionRegistry.for('event').getPermissions(role)`). Registration is additive, so no one file holds the whole
  policy — `tests/unit/core/permission-registry.test.ts`
  snapshots the assembled result.
- **Guard**: `scoped(scope, permission)` (`#core/permission.guard`) reads the bound model named by the scope's
  `ScopeResolver` and asks it for the user's permission set. `hasEventPermission(p)`, `newsletterManager(p)` and
  `organizationMember(p)` are one-line aliases of it. The owning module declares its resolver by returning it from
  `registerScopeResolvers()`; `boot.ts` registers each one and then calls `assertScopeResolversComplete()`, so a scope
  left unwired fails the boot instead of 500-ing on the first guarded request. Exactly one module owns a scope —
  registering a second resolver for it throws. Both the resolver and its alias live in the **subject** module's guard
  file, named after the scope's bound model (`event/event.guard.ts`, `newsletter/newsletter.guard.ts`,
  `organization/organization.guard.ts`) — not in the membership module whose service they call. Guards over a membership
  _record_ (`eventManagerSelf`, `eventManagerSubscriber`) stay with that record's module.
- **Resolve once per scope**: `EventManagerService.getManagerAuthorization`,
  `NewsletterManagerService.getManagerPermissions` and
  `OrganizationMemberService.getMemberPermissions` are the only places their scope's permissions are computed; the
  guard, the profile resource and (for events) the SSE subscriber all go through them.
- **Type safety**: use `ScopePermission<'event'>` (or `EventScopedPermission`) for event-only APIs. `Permission` is the
  union of all three scopes — passing an organization string to a event API must be a compile error, not a silent
  `false`.
- **Adding a permission**: add the string to its union in
  `common/src/permissions/permissions.ts`, rebuild `common`, return it from the owning module's `registerPermissions()`,
  guard the route, and update the registry snapshot. The role-permission dialog needs no edit — it renders
  `GET /permissions`.
- **Never hardcode the matrix in the frontend.** `GET /permissions` serves
  `permissionRegistry.toMatrix()`; `usePermissionMatrix(scope)` consumes it.

State and ownership rules (`registrationOpen`, `eventOrganizationVerified`,
`eventManagerSelf`, `organizationMemberSelf`, `buildEventWhere`, `file.guard.ts`)
are deliberately **not** permissions — they stay plain `GuardFn`s composed with
`or`/`and`.

## Email

- MJML templates in `backend/src/views/emails/`
- Use `Mailable` pattern; register in the mailable registry
- Dev email preview: http://localhost:1080 (MailDev)

## Background Jobs & Queues

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

## Organizations

Events and newsletters are owned by an `Organization`, moderated by system administrators — full design in
`docs/organizations.md`. Roles are `ADMIN`/`MEMBER`, resolved through the
`organization` permission scope (see [Permission scopes](#permission-scopes)).

- `organizationId` is **required** on `POST /events` and `POST /newsletters`; there is no server-side default. The id
  arrives in the body and guards run before validation, so
  `organizationFromBody()` binds it as the `organization` model ahead of
  `guard(organizationMember(…))`.
- An unverified organization may build events and newsletters freely, publication settings included — reach is **gated at
  the outward-facing action**, never at write time. The gates are
  `buildEventWhere` (public listing), the event `show` route guard, `registrationOpen`
  combined with `eventOrganizationVerified` (registrations), and
  `newsletterOrganizationVerified` (sending newsletter messages). Management UI reads
  `Event.organizationVerificationStatus` / `Newsletter.organizationVerificationStatus` to explain why a event isn't
  reaching anyone or why sending is disabled.
- Organization `ADMIN`s hold exactly `ORGANIZATION_EVENT_PERMISSIONS`
  (`event.view`, `event.edit`, `event.managers.view`) on every event their organization owns, merged in
  `EventManagerService.getManagerAuthorization()`, and exactly `ORGANIZATION_NEWSLETTER_PERMISSIONS`
  (`newsletter.view`, `newsletter.managers.view`) on every newsletter it owns, merged in
  `NewsletterManagerService.getManagerPermissions()`. **Never extend either constant to personal data** — registrations
  for events, subscribers for newsletters — nor to `newsletter.messages.*`; tests assert both sets' exact contents.
- Those implicit grants carry no manager record, so the owning entities never appear under
  `GET /events?view=assigned` or `GET /newsletters`. `GET /organizations/:id/events` and
  `GET /organizations/:id/newsletters` exist to make them reachable — add the matching listing whenever a new implicit
  grant is introduced, or the permission is unreachable outside a direct link.

## Realtime (SSE live updates)

Permission-filtered, invalidation-only SSE — full design in
`docs/live-updates-plan.md`. One stream per event
(`GET /events/:eventId/stream`); events carry `{resource, id, operation}` plus a
`requiredPermission` that the stream handler enforces per subscriber; clients
refetch via REST (single auth path). Echo suppression: the `X-Client-Id` header
is stored in the ambient request context (`core/context/requestContext.ts`,
AsyncLocalStorage) and stamped onto `event.origin` by `RealtimeService` itself.

Adding realtime to a module (no routing/stream changes needed):

1. `common/src/realtime/events.ts`: add the resource to `RealtimeResource` +
   `RESOURCE_VIEW_PERMISSION`; rebuild `common`.
2. Backend: inject `RealtimeService` into the **controller** and call
   `void realtimeService.emit(eventId, '<resource>', id, op)` after each write
   (`emitInvalidation(eventId, '<resource>')` for bulk operations) — fire-and-forget
   (`void`, not `await`): errors are swallowed internally, so awaiting would only
   add latency. Emits live exclusively in controllers — never inject
   `RealtimeService` into services. Source `eventId`/`id` from the bound model
   (`req.modelOrFail('event').id`, the service's returned entity) rather than
   the raw route param — see the model binding note above.
3. Frontend: call `useRealtimeCollection('<resource>', { data, invalidate, reload, fetchOne? })`
   (`src/composables/realtimeCollection.ts`) in the feature store or page —
   it handles refetch coalescing, ordering, and reconnect reloads.

Driver: `REALTIME_DRIVER` env (`redis`/`memory`); defaults to `redis` only when
`QUEUE_DRIVER=redis`. Multi-instance deploys on other queue drivers must set
`REALTIME_DRIVER=redis`.

## Backend Path Alias

`#*` maps to `src/*` in backend TypeScript.
