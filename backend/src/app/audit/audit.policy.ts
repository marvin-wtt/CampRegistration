import type { AuditEntityType } from '@camp-registration/common/entities';

// Contracts the audit module owns and each feature implements in its own
// `*.audit.ts`. The audit module depends on these interfaces, never on concrete
// entity fields — entity knowledge stays with the entity.

export interface AuditChangePolicy<T = unknown> {
  entityType: AuditEntityType;
  // Returns the NAMES of the fields that changed (never their values). Top-level
  // columns by name; deep JSON blobs by leaf dot-path.
  changedFields(
    before: T | null | undefined,
    after: T | null | undefined,
  ): string[];
}
