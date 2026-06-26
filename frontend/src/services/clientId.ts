/**
 * A unique id for this app instance (one per browser tab / page load), sent on
 * mutating requests so the server can stamp realtime events' `origin`. The
 * realtime store drops events whose origin is this id — the originator already
 * has the authoritative state from the mutation response.
 *
 * Deliberately in-memory (not persisted): a reload starts fresh and should not
 * suppress events, and each tab must have its own id so a user's other tabs
 * still react to changes.
 */
export const clientId: string = crypto.randomUUID();
