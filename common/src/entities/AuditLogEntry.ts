import { Identifiable } from './Identifiable.js';

export type AuditEntityType =
  | 'registration'
  | 'campManager'
  | 'camp'
  | 'message'
  | 'messageTemplate';

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
  changedFields: string[] | null;
  createdAt: string;
}
