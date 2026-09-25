import type {
  AuditDetails,
  AuditEntityType,
} from '@camp-registration/common/entities';

// Implemented by each feature in its `*.audit.ts`, so entity knowledge stays
// with the entity.

export interface AuditSubject<T = unknown> {
  entityType: AuditEntityType;
  // Where the entity's entries are filed.
  locate(entity: T): { entityId: string; eventId: string | null };
  // What identifies the entity once it's gone; recorded on every entry
  // except updates, whose policy decides.
  identity?(entity: T): AuditDetails;
}

export interface AuditChangePolicy<T = unknown> extends AuditSubject<T> {
  // The changed field names, values safe to record, and identifying context.
  details(
    before: T | null | undefined,
    after: T | null | undefined,
  ): AuditDetails;
}
