import { isDeepStrictEqual } from 'node:util';
import { SurveyModel } from 'survey-core';
import { composeChangeSet, diffExcept } from '#app/audit/audit.diff';
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

// The form is a deeply nested, array-structured SurveyJS definition; a structural
// leaf-diff would serialize ~the whole form into the row (our diff treats arrays
// as opaque). Instead record the form's field inventory (the question names it
// collects) before/after — bounded, and the GDPR-relevant "what data is gathered".
function formFieldNames(form: unknown): string[] {
  try {
    return new SurveyModel(form ?? {})
      .getAllQuestions(false, undefined, true)
      .map((question) => question.name)
      .sort();
  } catch {
    return [];
  }
}

export const campAuditPolicy: AuditChangePolicy<Camp> = {
  entityType: 'camp',

  changeSet(before, after) {
    const fields = diffExcept(before, after, DENY_KEYS);

    if (
      before != null &&
      after != null &&
      !isDeepStrictEqual(before.form, after.form)
    ) {
      fields.form = {
        from: formFieldNames(before.form),
        to: formFieldNames(after.form),
      };
    }

    return composeChangeSet(fields);
  },
};
