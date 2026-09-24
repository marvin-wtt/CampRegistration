import { changedKeysExcept, composeDetails } from '#app/audit/audit.diff';
import { formFieldChanges } from '#app/audit/audit.surveyForm';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Event } from '#generated/prisma/client';

// Every column is tracked by default so a new setting can't silently escape
// the audit. Denied: metadata, cosmetics, system-written fields, and `form`,
// which is diffed per question below.
const DENY_KEYS: (keyof Event)[] = [
  'id',
  'createdAt',
  'updatedAt',
  'themes',
  'retentionReminderSentAt',
  'form',
];

export const eventAuditPolicy: AuditChangePolicy<Event> = {
  entityType: 'event',

  details(before, after) {
    const fields = changedKeysExcept(before, after, DENY_KEYS);

    if (before != null && after != null) {
      fields.push(...formFieldChanges(before.form, after.form));
    }

    return composeDetails({ changedFields: fields });
  },
};
