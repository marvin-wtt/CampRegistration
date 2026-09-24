import type {
  AuditDetails,
  AuditEntityType,
} from '@camp-registration/common/entities';

// Contracts the audit module owns and each feature implements in its own
// `*.audit.ts`. The audit module depends on these interfaces, never on concrete
// entity fields — entity knowledge stays with the entity.

export interface AuditChangePolicy<T = unknown> {
  entityType: AuditEntityType;
  // Builds an update entry's details: the names of the changed fields, the
  // values safe to record, and whatever identifies the entity.
  details(
    before: T | null | undefined,
    after: T | null | undefined,
  ): AuditDetails;
}
