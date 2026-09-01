import type { EventScopedPermission } from '../permissions/permissions.js';

/**
 * Resources that can be broadcast over a realtime stream. Each maps to a single
 * "view" permission via {@link RESOURCE_VIEW_PERMISSION}.
 *
 * Note: beds are not a resource of their own — bed mutations emit a
 * `{ resource: 'room', id: roomId, operation: 'updated' }` event, since beds
 * are embedded in rooms (`Room.beds`) and covered by `event.rooms.view`.
 * Chore assignment members follow the same pattern: they are not a resource of
 * their own — membership changes are just a `choreAssignment` update.
 */
export type RealtimeResource =
  | 'event'
  | 'registration'
  | 'program_item'
  | 'room'
  | 'task'
  | 'chore'
  | 'choreAssignment'
  | 'manager'
  | 'message'
  | 'file'
  | 'table_template'
  | 'setting';

/**
 * `created` / `updated` / `deleted` target a single entity (`id` set).
 * `invalidated` targets the whole collection (`id` is null) — emitted for bulk
 * operations where per-entity events would trigger a refetch stampede.
 */
export type RealtimeOperation =
  'created' | 'updated' | 'deleted' | 'invalidated';

/**
 * Invalidation-only realtime event. Carries no model data — recipients refetch
 * the affected resource through the REST API, where full (field-level)
 * authorization is enforced. See docs/live-updates-plan.md.
 */
export interface RealtimeEvent {
  resource: RealtimeResource;
  /** Entity id; `null` only when `operation === 'invalidated'` (collection-level). */
  id: string | null;
  operation: RealtimeOperation;
  /**
   * The "view" permission a recipient must hold to be told about this change.
   * Enforced per event by the SSE stream handler, so a single event stream can
   * carry resources that not every event role may see (e.g. managers, messages).
   */
  requiredPermission?: EventScopedPermission;
  /**
   * Id of the client (browser tab / app instance) that triggered the change,
   * taken from the {@link CLIENT_ID_HEADER} request header. Clients ignore
   * events whose origin is their own — the originator already has the
   * authoritative state from the mutation response, so it must not refetch.
   */
  origin?: string;
  /** ISO-8601 timestamp of when the change was emitted. */
  at: string;
}

/**
 * Request header carrying the originating client's id on mutating requests, so
 * the server can stamp {@link RealtimeEvent.origin} and the originator can skip
 * its own echo.
 */
export const CLIENT_ID_HEADER = 'X-Client-Id';

/**
 * The view permission required to receive events for a given resource. The SSE
 * layer is event-scoped end to end, so these are always event permissions.
 */
export const RESOURCE_VIEW_PERMISSION: Record<
  RealtimeResource,
  EventScopedPermission
> = {
  event: 'event.view',
  registration: 'event.registrations.view',
  program_item: 'event.program_items.view',
  room: 'event.rooms.view',
  task: 'event.tasks.view',
  chore: 'event.chores.view',
  choreAssignment: 'event.chore_assignments.view',
  manager: 'event.managers.view',
  message: 'event.messages.view',
  file: 'event.files.view',
  table_template: 'event.table_templates.view',
  setting: 'event.view',
};
