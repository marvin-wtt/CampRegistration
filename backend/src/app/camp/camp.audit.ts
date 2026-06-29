import { isDeepStrictEqual } from 'node:util';
import { SurveyModel } from 'survey-core';
import { changedKeysExcept, composeChangedFields } from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Camp } from '#generated/prisma/client';

// Camp is configuration, not participant PII, so we track changes to *every*
// column by default (a new setting shouldn't silently escape the audit) and
// deny only the few that don't belong: `themes` (cosmetic), `id`/`createdAt`/
// `updatedAt` (metadata — `updatedAt` would otherwise fire on every write), and
// `form` (handled separately below as a field inventory).
const DENY_KEYS: (keyof Camp)[] = [
  'id',
  'createdAt',
  'updatedAt',
  'themes',
  'form',
];

// The form is a deeply nested SurveyJS definition. Rather than diff its
// structure, compare its field inventory (the question names it collects) and
// report each question added or removed as `form.<name>` — bounded, and the
// GDPR-relevant "what data is gathered".
function formFieldNames(form: unknown): string[] {
  try {
    return new SurveyModel(form ?? {})
      .getAllQuestions(false, undefined, true)
      .map((question) => question.name);
  } catch {
    return [];
  }
}

export const campAuditPolicy: AuditChangePolicy<Camp> = {
  entityType: 'camp',

  changedFields(before, after) {
    const fields = changedKeysExcept(before, after, DENY_KEYS);

    if (
      before != null &&
      after != null &&
      !isDeepStrictEqual(before.form, after.form)
    ) {
      const beforeNames = new Set(formFieldNames(before.form));
      const afterNames = new Set(formFieldNames(after.form));
      for (const name of new Set([...beforeNames, ...afterNames])) {
        // A question added or removed changes what data the camp collects.
        if (beforeNames.has(name) !== afterNames.has(name)) {
          fields.push(`form.${name}`);
        }
      }
    }

    return composeChangedFields(fields);
  },
};
