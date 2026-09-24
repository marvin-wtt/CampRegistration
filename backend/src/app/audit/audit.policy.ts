import type {
  AuditDetails,
  AuditEntityType,
} from '@camp-registration/common/entities';

// Implemented by each feature in its `*.audit.ts`, so entity knowledge stays
// with the entity.

export interface AuditChangePolicy<T = unknown> {
  entityType: AuditEntityType;
  // The changed field names, values safe to record, and identifying context.
  details(
    before: T | null | undefined,
    after: T | null | undefined,
  ): AuditDetails;
}
