import type { Permission } from '../permissions/permissions.js';

/**
 * Resources that can be broadcast over a realtime stream. Each maps to a single
 * "view" permission via {@link RESOURCE_VIEW_PERMISSION}.
 */
export type RealtimeResource =
  | 'camp'
  | 'registration'
  | 'program_event'
  | 'room'
  | 'bed';

export type RealtimeOperation = 'created' | 'updated' | 'deleted';

/**
 * Invalidation-only realtime event. Carries no model data — recipients refetch
 * the affected resource through the REST API, where full (field-level)
 * authorization is enforced. See docs/live-updates-plan.md.
 */
export interface RealtimeEvent {
  resource: RealtimeResource;
  id: string;
  operation: RealtimeOperation;
  /**
   * The "view" permission a recipient must hold to be told about this change.
   * Forward-compat hook for mixed-resource streams; unused in v1 because every
   * stream is gated by a single connect-time guard.
   */
  requiredPermission?: Permission;
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

/** The view permission required to receive events for a given resource. */
export const RESOURCE_VIEW_PERMISSION: Record<RealtimeResource, Permission> = {
  camp: 'camp.view',
  registration: 'camp.registrations.view',
  program_event: 'camp.program_events.view',
  room: 'camp.rooms.view',
  bed: 'camp.rooms.view',
};
