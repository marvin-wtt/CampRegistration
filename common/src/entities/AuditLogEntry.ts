import { Identifiable } from './Identifiable.js';

export type AuditEntityType =
  'registration' | 'eventManager' | 'event' | 'message' | 'messageTemplate';

// Scalars only — a deliberate constraint so values stay bounded and non-PII
// (you can't accidentally dump a whole object or free-text answer in here).
export type AuditValue = string | number | boolean | null;

export interface AuditChangeSet {
  // Names of the fields that changed — never their values. Top-level columns by
  // name; the `data`/`customData` blobs by leaf dot-path (`data.allergies`).
  // Values live on the record and are erased with it, so this carries no PII.
  changedFields?: string[];
  // New values of changed fields a policy has marked safe to record: bounded,
  // non-identifying scalars only (e.g. a registration's `status`, or an event's
  // `active` flag). Lets the timeline show the outcome ("Accepted") without
  // storing personal data. Keyed by field name.
  changedValues?: Record<string, AuditValue>;
  // The id of the user this entry is *about*, when that differs from both the
  // actor and the entity itself (e.g. an eventManager entry's `entityId` is the
  // grant record, not the person — this is the person). Resolved into
  // `AuditLogEntry.subject` at read time, the same way `actorId` is resolved
  // into `actor` — never stored as a name here.
  subjectId?: string | null;
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
  changes: AuditChangeSet | null;
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
