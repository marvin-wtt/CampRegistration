import { Identifiable } from './Identifiable.js';

export const AUDIT_ENTITY_TYPES = [
  'event',
  'registration',
  'eventManager',
  'message',
  'messageTemplate',
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

// Scalars only — a deliberate constraint so values stay bounded and non-PII
// (you can't accidentally dump a whole object or free-text answer in here).
export type AuditValue = string | number | boolean | null;

// Everything an entry records beyond who did what to which entity: what
// changed, what identifies the entity, who it's about, and why.
export interface AuditDetails {
  // Names of the fields that changed — never their values. Top-level columns by
  // name; the `data`/`customData` blobs by leaf dot-path (`data.allergies`).
  changedFields?: string[];
  // Field values a policy has marked safe to record — bounded, non-identifying
  // scalars (e.g. a registration's `status`): the new value on update, the
  // initial one on create. Keyed by field name.
  values?: Record<string, AuditValue>;
  // Values that identify the entity (e.g. a manager's `role`, a template's
  // `trigger`), attached to every entry whether or not they changed — so
  // create/delete entries, which have no diff, are still identifiable.
  context?: Record<string, AuditValue>;
  // Why the action happened, as a fixed code (e.g. a registration's delete
  // reason) — never free text, so no personal data can end up here.
  reason?: string;
  // The id of the user this entry is *about*, when that differs from both the
  // actor and the entity itself (e.g. an eventManager entry's `entityId` is the
  // grant record, not the person — this is the person). Resolved into
  // `AuditLogEntry.subject` at read time — never stored as a name here.
  subjectId?: string | null;
  // A masked identifier (e.g. `j***@example.com`) for a subject with no user
  // account to resolve — a pending invitation. Only set when `subjectId` isn't.
  subjectHint?: string;
}

export interface AuditActor {
  id: string;
  // Resolved at read-time; null when the user was deleted/erased
  name: string | null;
}

export interface AuditLogEntry extends Identifiable {
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  eventId: string | null;
  actor: AuditActor | null;
  // The entity's "subject" user, when it has one distinct from the actor
  // (e.g. the manager an eventManager entry is about) — resolved the same way
  // as `actor`, never stored as a name.
  subject: AuditActor | null;
  details: AuditDetails | null;
  createdAt: string;
}

export interface AuditLogQuery {
  entityType?: AuditEntityType | AuditEntityType[];
  entityId?: string;
  actorId?: string | string[];
  hideSystem?: boolean; // exclude actor === null entries
  from?: string; // ISO datetime, inclusive
  to?: string; // ISO datetime, inclusive
  cursor?: string;
  limit?: number;
}
