import type { AuditEntityType } from '@camp-registration/common/entities';

// Display names of the event's entities that still exist, by id. An id missing
// from the result means the entity has been deleted.
export type AuditNameResolver = (
  eventId: string,
  ids: string[],
) => Promise<Map<string, string>>;

const resolvers = new Map<AuditEntityType, AuditNameResolver>();

// Lets a feature name its entities in the audit log without the audit module
// reading their fields.
export function registerAuditNameResolver(
  entityType: AuditEntityType,
  resolver: AuditNameResolver,
): void {
  if (resolvers.has(entityType)) {
    throw new Error(
      `Audit name resolver for "${entityType}" is already registered.`,
    );
  }
  resolvers.set(entityType, resolver);
}

export function getAuditNameResolver(
  entityType: AuditEntityType,
): AuditNameResolver | undefined {
  return resolvers.get(entityType);
}

export function unregisterAllAuditNameResolvers(): void {
  resolvers.clear();
}
