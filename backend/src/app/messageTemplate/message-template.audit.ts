import {
  changedKeysByAllowList,
  composeChangeSet,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { MessageTemplate } from '#generated/prisma/client';

// Editable template content. `trigger`/`country` identify the template (which
// automated email + country variant); `subject`/`body`/`priority`/`replyTo` are
// the editable content. Template content is configuration, not participant PII —
// only the changed field names are recorded, never their values.
const FIELD_ALLOWLIST: (keyof MessageTemplate)[] = [
  'trigger',
  'country',
  'subject',
  'body',
  'priority',
  'replyTo',
];

export const messageTemplateAuditPolicy: AuditChangePolicy<MessageTemplate> = {
  entityType: 'messageTemplate',

  changeSet(before, after) {
    return composeChangeSet(
      changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
      templateIdentity(after ?? before),
    );
  },
};

/**
 * `trigger`/`country` never change after creation, so a plain diff never
 * records them — but without them an entry can't say *which* template it's
 * about. Always attach the current values (not just when they change) so
 * create, update, and delete entries are all identifiable on their own.
 */
export function templateIdentity(
  template: Pick<MessageTemplate, 'trigger' | 'country'> | null | undefined,
): Record<string, string | null> {
  if (!template) {
    return {};
  }
  return { trigger: template.trigger, country: template.country };
}
