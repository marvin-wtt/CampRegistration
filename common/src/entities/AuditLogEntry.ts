import { Identifiable } from './Identifiable.js';

export type AuditEntityType =
  | 'registration'
  | 'campManager'
  | 'camp'
  | 'message'
  | 'messageTemplate';

// Scalars only — a deliberate constraint so values stay bounded and non-PII
// (you can't accidentally dump a whole object or free-text answer in here).
export type AuditValue = string | number | boolean | null;

export interface AuditChangeSet {
  // Names of the fields that changed — never their values. Top-level columns by
  // name; the `data`/`customData` blobs by leaf dot-path (`data.allergies`).
  // Values live on the record and are erased with it, so this carries no PII.
  changedFields?: string[];
  // New values of changed fields a policy has marked safe to record: bounded,
  // non-identifying scalars only (e.g. a registration's `status`, or a camp's
  // `active` flag). Lets the timeline show the outcome ("Accepted") without
  // storing personal data. Keyed by field name.
  changedValues?: Record<string, AuditValue>;
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
  campId: string | null;
  actor: AuditActor | null;
  changes: AuditChangeSet | null;
  createdAt: string;
}
