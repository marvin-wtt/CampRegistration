import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

// Contracts the audit module owns and each feature implements in its own
// `*.audit.ts`. The audit module depends on these interfaces, never on concrete
// entity fields — entity knowledge stays with the entity.

export interface AuditChangePolicy<T = unknown> {
  entityType: AuditEntityType;
  // Builds the change set: the NAMES of the fields that changed (never their
  // values), plus the new `status` value for the one bounded, non-identifying
  // field whose outcome is worth surfacing.
  changeSet(
    before: T | null | undefined,
    after: T | null | undefined,
  ): AuditChangeSet;
}
