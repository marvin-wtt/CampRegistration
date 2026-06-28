import type { AuditSnapshotPolicy } from '#app/audit/audit.policy';

export const messageAuditPolicy: AuditSnapshotPolicy = {
  entityType: 'message',

  // Body deliberately omitted to limit PII duplication. `recipients` is empty on
  // send (no deliveries yet) and populated on delete (deliveries loaded).
  snapshot(entity) {
    const message = entity as {
      subject?: string;
      deliveries?: { to: string | null }[];
    };
    return {
      subject: message.subject ?? null,
      recipients: (message.deliveries ?? [])
        .map((delivery) => delivery.to)
        .filter((to): to is string => to !== null),
    };
  },
};
