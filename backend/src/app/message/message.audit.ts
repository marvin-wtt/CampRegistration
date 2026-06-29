import type { AuditEntityType } from '@camp-registration/common/entities';

// Messages are only ever created (on send) and deleted — there is no update, so
// only the entity type is needed. The audit entry records the event itself; no
// message content (recipient addresses, body) is written to the log.
export const messageAuditPolicy: { entityType: AuditEntityType } = {
  entityType: 'message',
};
