---
name: add-realtime-resource
description: Wire a resource into the SSE live-update stream — the RealtimeResource union, controller emits, and the frontend collection composable. Use when a camp-scoped resource should refresh in other clients after a write, or when an existing realtime resource behaves wrong.
---

# Adding realtime to a module

The stream is **permission-filtered and invalidation-only**: events carry
`{resource, id, operation}` plus a `requiredPermission` the stream handler enforces
per subscriber, and clients refetch through REST so there is a single auth path.
No model data ever rides on an event. Full design: `docs/live-updates-plan.md`.

Adding a resource needs no routing or stream changes — three steps:

## 1. Declare the resource

In `common/src/realtime/events.ts`, add it to `RealtimeResource` and give it an
entry in `RESOURCE_VIEW_PERMISSION`. Then rebuild: `npm run build --workspace common`.

Resources that are embedded in another entity don't get their own entry — bed
mutations emit `{ resource: 'room', id: roomId, operation: 'updated' }`, since beds
live in `Room.beds` and are covered by `camp.rooms.view`.

## 2. Emit from the controller

Inject `RealtimeService` into the **controller** and call it after each write:

```ts
void realtimeService.emit(campId, '<resource>', id, op);
void realtimeService.emitInvalidation(campId, '<resource>'); // bulk operations
```

- **Controllers only.** Never inject `RealtimeService` into a service.
- **Fire-and-forget** — `void`, not `await`. Errors are swallowed internally, so
  awaiting only adds latency to the response.
- **Source ids from the bound model**, not the raw route param:
  `req.modelOrFail('camp').id` and the id off the entity the service returned. The
  binding already fetched and validated the entity.
- Use `invalidated` for bulk operations; per-entity events would trigger a refetch
  stampede.

Echo suppression is automatic: the `X-Client-Id` header is read from the ambient
request context (`core/context/requestContext.ts`, AsyncLocalStorage) and stamped
onto `event.origin` by `RealtimeService` itself. Don't pass it around by hand.

## 3. Consume on the frontend

In the feature store or page, call:

```ts
useRealtimeCollection('<resource>', { data, invalidate, reload, fetchOne? });
```

(`frontend/src/composables/realtimeCollection.ts`) It handles refetch coalescing,
ordering, and reload-on-reconnect.

## Driver

`REALTIME_DRIVER` (`redis` / `memory`) defaults to `redis` only when
`QUEUE_DRIVER=redis`. A multi-instance deploy on any other queue driver must set
`REALTIME_DRIVER=redis` explicitly, or clients on one instance miss the other's
events.
