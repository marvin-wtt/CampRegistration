import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

// Contracts the audit module owns and each feature implements in its own
// `*.audit.ts`. The audit module depends on these interfaces, never on concrete
// entity fields — entity knowledge stays with the entity.

export interface AuditChangePolicy<T = unknown> {
  entityType: AuditEntityType;
  changeSet(
    before: T | null | undefined,
    after: T | null | undefined,
  ): AuditChangeSet;
}

export interface AuditSnapshotPolicy<T = unknown> {
  entityType: AuditEntityType;
  snapshot(entity: T | null | undefined): Record<string, unknown>;
}
