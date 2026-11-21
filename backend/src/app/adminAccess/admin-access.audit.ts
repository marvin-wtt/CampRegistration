import type { AuditSubject } from '#app/audit/audit.policy';
import type { AdminAccessGrant } from '#generated/prisma/client';

// The reason is free text, so it stays on the grant; the log shows it through
// the name resolver. No context: the entry's event and time already say the
// rest.
export const adminAccessGrantAudit: AuditSubject<AdminAccessGrant> = {
  entityType: 'adminAccessGrant',

  locate: (grant) => ({
    entityId: grant.id,
    eventId: grant.scope === 'event' ? grant.scopeId : null,
  }),
};
