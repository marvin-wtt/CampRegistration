import type { AuditSubject } from '#app/audit/audit.policy';
import type { Message } from '#generated/prisma/client';

// Messages are sent once and never edited, so there is no change policy.
export const messageAuditSubject: AuditSubject<Message> = {
  entityType: 'message',

  locate: (message) => ({ entityId: message.id, eventId: message.eventId }),
};
