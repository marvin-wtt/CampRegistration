import { Identifiable } from './Identifiable.js';

export type AuditEntityType =
  | 'registration'
  | 'campManager'
  | 'camp'
  | 'message'
  | 'messageTemplate';

export interface AuditFieldChange {
  from: unknown;
  to: unknown;
}

export interface AuditChangeSet {
  // Top-level scalar/JSON field changes (status, role, expiresAt, …)
  fields?: Record<string, AuditFieldChange>;
  // Leaf-level diff of the registration `data` blob, keyed by form question key
  data?: Record<string, AuditFieldChange>;
  // Snapshot of source-of-truth fields captured for delete events
  snapshot?: Record<string, unknown>;
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
