import {
  changedKeysByAllowList,
  composeChangedFields,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { MessageTemplate } from '#generated/prisma/client';

// Editable template content. `event`/`country` identify the template (which
// automated email + country variant); `subject`/`body`/`priority`/`replyTo` are
// the editable content. Template content is configuration, not participant PII —
// only the changed field names are recorded, never their values.
const FIELD_ALLOWLIST: (keyof MessageTemplate)[] = [
  'event',
  'country',
  'subject',
  'body',
  'priority',
  'replyTo',
];

export const messageTemplateAuditPolicy: AuditChangePolicy<MessageTemplate> = {
  entityType: 'messageTemplate',

  changedFields(before, after) {
    return composeChangedFields(
      changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
    );
  },
};
