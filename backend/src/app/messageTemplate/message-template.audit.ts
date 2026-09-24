import { changedKeysByAllowList, composeDetails } from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { MessageTemplate } from '#generated/prisma/client';
import type { AuditDetails } from '@camp-registration/common/entities';

// Editable content — only the names of changed fields are recorded.
const FIELD_ALLOWLIST: (keyof MessageTemplate)[] = [
  'subject',
  'body',
  'priority',
  'replyTo',
];

type AuditedTemplate = MessageTemplate & { attachments?: { id: string }[] };

export const messageTemplateAuditPolicy: AuditChangePolicy<AuditedTemplate> = {
  entityType: 'messageTemplate',

  details(before, after) {
    const fields = changedKeysByAllowList(before, after, FIELD_ALLOWLIST);
    if (attachmentsChanged(before, after)) {
      fields.push('attachments');
    }
    return composeDetails({
      changedFields: fields,
      ...templateIdentity(after ?? before),
    });
  },
};

function attachmentsChanged(
  before: AuditedTemplate | null | undefined,
  after: AuditedTemplate | null | undefined,
): boolean {
  const ids = (template: AuditedTemplate | null | undefined) =>
    (template?.attachments ?? [])
      .map((file) => file.id)
      .sort()
      .join();
  return ids(before) !== ids(after);
}

// Which automated email (and country variant) an entry is about.
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
