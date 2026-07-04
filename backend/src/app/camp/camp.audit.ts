import { changedKeysExcept, composeChangeSet } from '#app/audit/audit.diff';
import { formFieldChanges } from '#app/audit/audit.surveyForm';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Camp } from '#generated/prisma/client';

// Camp is configuration, not participant PII, so we track changes to *every*
// column by default (a new setting shouldn't silently escape the audit) and
// deny only the few that don't belong: `themes` (cosmetic), `id`/`createdAt`/
// `updatedAt` (metadata — `updatedAt` would otherwise fire on every write), and
// `form` (handled separately below via `formFieldChanges`).
const DENY_KEYS: (keyof Camp)[] = [
  'id',
  'createdAt',
  'updatedAt',
  'themes',
  'form',
];

export const campAuditPolicy: AuditChangePolicy<Camp> = {
  entityType: 'camp',

  changeSet(before, after) {
    const fields = changedKeysExcept(before, after, DENY_KEYS);

    if (before != null && after != null) {
      fields.push(...formFieldChanges(before.form, after.form));
    }

    return composeChangeSet(fields);
  },
};
