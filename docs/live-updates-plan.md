# Live Updates — Design & Conventions

Real-time UI updates via **permission-filtered Server-Sent Events (SSE)** with
**invalidation-only payloads**. Clients receive "entity X changed" signals and
refetch through the existing REST endpoints, so all field-level authorization
stays in exactly one place (the REST guards).

## Why this design

- **One auth path.** SSE never carries model data — only `{resource, id, op}`.
  The client refetches via REST, which already runs RBAC + field-level redaction.
  No parallel authorization logic to keep in sync (avoids data-leak drift).
- **ULID leak awareness.** Because PKs are timestamp-encoded ULIDs, even leaking
  _which ids changed_ to an unauthorized user discloses existence + timing.
  Every event therefore carries the `requiredPermission` of its resource, and
  the SSE handler drops events the subscriber may not see.
- **Backplane.** SSE state is per-process; Redis pub/sub fans events across
  backend instances. The driver is selected by `REALTIME_DRIVER`
  (`redis`/`memory`), defaulting to `redis` when `QUEUE_DRIVER=redis` and
  `memory` otherwise. Multi-instance deployments that do **not** use the redis
  queue driver must set `REALTIME_DRIVER=redis` explicitly.

## Stream model

**One stream per camp**: `GET /camps/:campId/events` (mounted in
`camp.routes.ts`), guarded by `auth()` + `campManager('camp.view')`. It carries
**all** camp resources; per-event filtering makes it safe to include resources
not every role may see.

### Per-event permission filtering

- At connect, `campManagerSubscriber` (camp-manager.guard.ts) resolves the
  subscriber's role → permission set (+ manager `expiresAt`).
- Each event is delivered only if the subscriber holds the event's
  `requiredPermission` (see `shouldDeliver` in `realtime.stream.ts`).
- Whenever a `manager` event for the camp arrives, the handler re-resolves the
  subscriber's permissions (their own role may have changed) — _before_
  filtering, so roles that can't see manager events still refresh.
- **Staleness window**: one bus hop (memory: same tick; Redis: ~1–5 ms) plus
  one DB round-trip for the refresh — the same freshness class as a REST
  request's guard check. Events arriving inside the window are filtered with
  the pre-change set (the triggering manager event itself is deliberately
  delivered under the old set). Manager `expiresAt` is checked locally on every
  delivery, so expiry is effective immediately.
- **Fail-closed**: if the refresh resolves to `null` (removed/expired) or
  throws (e.g. DB error), the stream ends; the client's `EventSource`
  reconnects (retry: 5000) and the connect guard re-validates. No events are
  ever delivered under an unverifiable permission set.

### Resources

| Resource         | View permission             | Notes                                                                                                                                       |
| ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `camp`           | `camp.view`                 |                                                                                                                                             |
| `registration`   | `camp.registrations.view`   |                                                                                                                                             |
| `program_event`  | `camp.program_events.view`  |                                                                                                                                             |
| `room`           | `camp.rooms.view`           | Bed changes emit `room updated` for the parent room (beds render embedded in rooms). Bulk reorders emit one collection `invalidated` event. |
| `task`           | `camp.tasks.view`           |                                                                                                                                             |
| `manager`        | `camp.managers.view`        | Not visible to VIEWER.                                                                                                                      |
| `message`        | `camp.messages.view`        | DIRECTOR/COORDINATOR only.                                                                                                                  |
| `file`           | `camp.files.view`           | Camp-owned files only. The async upload-completion (`READY`) status flip does **not** emit (see known gaps).                                |
| `table_template` | `camp.table_templates.view` |                                                                                                                                             |

## Event payload (invalidation-only)

```ts
{
  resource: RealtimeResource,
  id: string | null,               // null only for operation 'invalidated'
  operation: 'created' | 'updated' | 'deleted' | 'invalidated',
  requiredPermission?: Permission, // enforced per event by the SSE handler
  origin?: string,                 // originating client id (echo suppression)
  at: string,                      // ISO timestamp
}
```

`invalidated` (with `id: null`) is a **collection-level** event emitted for bulk
operations (e.g. `PATCH /rooms/`): "the collection changed — refetch the list",
instead of a per-entity event stampede.

**Echo suppression.** The server emits on _every_ write, including the
originator's. Each app instance (browser tab) generates an in-memory `clientId`
(`crypto.randomUUID()`) and sends it on mutating requests via the `X-Client-Id`
header. The context middleware (`middlewares/context.middleware.ts`) stores it
in the ambient **request context** (`core/context/requestContext.ts`,
AsyncLocalStorage), and `RealtimeService`
stamps it onto `event.origin` itself — emit calls never pass it explicitly.
Emits outside a request (queue jobs, scheduler) get no origin, so every client
reacts. The realtime store drops events whose `origin` equals its own
`clientId` in one place (`dispatch`) — the originator already has authoritative
state from the mutation response, while the user's _other_ tabs (different
`clientId`) still react. Filtering is client-side because `EventSource` cannot
send custom headers.

## Frontend

- `stores/realtime-store.ts` owns the single `EventSource` for the active camp
  and acts as a registry: feature stores subscribe via `on(resource, handler)` /
  `onReconnect(resource, handler)`. `connect()` is called once from
  `CampManagementLayout`; the stream closes on logout / leaving the camp.
- `composables/realtimeCollection.ts` — **`useRealtimeCollection(resource, options)`**
  implements the shared reconciliation in one place:
  - list not loaded → `invalidate()` only;
  - `deleted` → remove locally (cancelling in-flight refetches of that id);
  - `created`/`updated` → `fetchOne` + upsert, with per-id coalescing and
    in-order application (a slow stale response can never override a newer one);
  - `invalidated` / list mode (no `fetchOne`) → one debounced full reload;
    reloads bump a generation counter that voids in-flight item fetches;
  - reconnect → full reload (only if the list is loaded).
  - Cleanup registers with `onScopeDispose`, so the composable works in Pinia
    stores (lives with the store) and page components (unsubscribes on unmount)
    alike — rooms (`RoomPlannerPage`) and messages (`ContactPage`) wire it at
    page level because they have no store.

## Adding realtime to a new module

1. **common**: add the resource to `RealtimeResource` and
   `RESOURCE_VIEW_PERMISSION` in `common/src/realtime/events.ts`; rebuild.
2. **backend**: inject `RealtimeService` into the module's **controller** and
   call `realtimeService.emit(campId, '<resource>', id, 'created'|'updated'|'deleted')`
   after each successful write (`emitInvalidation(campId, '<resource>')` for
   bulk operations). The event origin is stamped automatically from the request
   context. **Emits live exclusively in controllers** — services stay
   transport-agnostic and must not depend on `RealtimeService`.
3. **frontend**: in the feature store (or page), call
   `useRealtimeCollection('<resource>', { data, invalidate, reload, fetchOne? })`.

No routes, streams, or realtime-layer changes needed.

## Known gaps (accepted)

- Changes outside the HTTP layer do not emit (controllers-only rule):
  the async file upload-completion (`READY`) status flip,
  `resolveManagerInvitations` (cross-camp `updateMany` on signup), and message
  delivery-status updates from mail jobs — stale until the next event or
  visit. If one of these ever needs realtime, add a completion hook at the
  queue layer rather than injecting `RealtimeService` into a service.
- Registration-owned file changes do not emit `registration updated` events
  (possible follow-up).
- No durable event log/replay: native `EventSource` auto-reconnect + the
  reconnect reload covers missed events.
