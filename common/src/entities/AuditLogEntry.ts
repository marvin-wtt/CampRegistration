import { Identifiable } from './Identifiable.js';

export const AUDIT_ENTITY_TYPES = [
  'event',
  'registration',
  'eventManager',
  'message',
  'messageTemplate',
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

// Scalars only, so a value can never carry a whole object or free-text answer.
export type AuditValue = string | number | boolean | null;

export interface AuditDetails {
  // Changed field names, never values; `data`/`customData` by leaf path.
  changedFields?: string[];
  // Values a policy marks safe to record (e.g. a registration's `status`).
  values?: Record<string, AuditValue>;
  // Identifies the entity on every entry, changed or not (e.g. a manager's role).
  context?: Record<string, AuditValue>;
  // A fixed code, never free text (e.g. a registration's delete reason).
  reason?: string;
  // The user the entry is about, when that isn't the entity itself (the person
  // behind a manager grant). Resolved into `AuditLogEntry.subject` at read time.
  subjectId?: string | null;
  // Masked identifier for a subject without an account (a pending invitation).
  subjectHint?: string;
}

export interface AuditActor {
  id: string;
  // Null when the user has been deleted.
  name: string | null;
}

export interface AuditLogEntry extends Identifiable {
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  eventId: string | null;
  actor: AuditActor | null;
  subject: AuditActor | null;
  // The entity's current display name, `null` once it's deleted. Absent for
  // entity types that don't resolve names, and on per-registration lists.
  entityName?: string | null;
  details: AuditDetails | null;
  createdAt: string;
}

export interface AuditLogQuery {
  entityType?: AuditEntityType | AuditEntityType[] | undefined;
  entityId?: string | undefined;
  actorId?: string | string[] | undefined;
  hideSystem?: boolean | undefined; // exclude actor === null entries
  from?: string | undefined; // ISO datetime, inclusive
  to?: string | undefined; // ISO datetime, inclusive
  cursor?: string | undefined;
  limit?: number | undefined;
}
