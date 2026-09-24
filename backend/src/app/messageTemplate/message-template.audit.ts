import { changedKeysByAllowList, composeDetails } from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { MessageTemplate } from '#generated/prisma/client';
import type { AuditDetails } from '@camp-registration/common/entities';

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

  details(before, after) {
    return composeDetails({
      changedFields: changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
      ...templateIdentity(after ?? before),
    });
  },
};

// `trigger`/`country` say *which* template an entry is about (which automated
// email, which country variant); they never change after creation.
export function templateIdentity(
  template: Pick<MessageTemplate, 'trigger' | 'country'> | null | undefined,
): AuditDetails {
  if (!template) {
    return {};
  }
  return {
    context: { trigger: template.trigger, country: template.country },
  };
}
