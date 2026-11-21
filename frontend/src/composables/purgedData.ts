import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import type { EventDetails } from '@camp-registration/common/entities';
import {
  isSpecialCategory,
  specialCategoryAnswerKeys,
} from '@camp-registration/common/form';
import { isRetentionPurged } from '@camp-registration/common/privacy';
import type { SurveyModel } from 'survey-core';

type PurgeState = Pick<
  EventDetails,
  'form' | 'sensitiveDataPurgedAt' | 'registrationDataPurgedAt'
>;

/**
 * Whether a registration field path (`data.allergies`, `data.kids[0].meds`)
 * reaches one of the given answer paths (`allergies`, `kids.meds`, `kids.*.meds`
 * with `*` for any row name): the path itself, or anything stored beneath it.
 * Matched as a whole path, so a top-level `notes` is not mistaken for a
 * sensitive `kids.notes`.
 */
export function reachesAnswerKey(
  path: string,
  keys: ReadonlySet<string>,
): boolean {
  if (!path.startsWith('data.') || keys.size === 0) {
    return false;
  }

  const raw = path
    .slice(5)
    .split(/[.[\]]+/)
    .filter((segment) => segment);
  // Entry indices dropped, unless a row is named like one.
  const withoutIndices = raw.filter((segment) => !/^\d+$/.test(segment));

  return [...keys].some((key) => {
    const pattern = key.split('.');
    return [withoutIndices, raw].some(
      (segments) =>
        pattern.length <= segments.length &&
        pattern.every((part, i) => part === '*' || part === segments[i]),
    );
  });
}

/**
 * The fields whose answers "Delete sensitive data" cleared (docs/privacy.md,
 * 8), read off the current form as the server does when checking edits.
 */
export function usePurgedFields(
  event: MaybeRefOrGetter<PurgeState | null | undefined>,
) {
  const keys = computed<Set<string>>(() => {
    const current = toValue(event);
    if (!current || !isRetentionPurged(current)) {
      return new Set();
    }

    return specialCategoryAnswerKeys(current.form);
  });

  return {
    keys,
    isPurged: (path: string) => reachesAnswerKey(path, keys.value),
  };
}

/**
 * Locks the questions whose answers were deleted and says why, so a manager
 * doesn't type an answer the server would refuse.
 */
export function lockPurgedQuestions(
  survey: SurveyModel,
  event: PurgeState,
  note: string,
): void {
  if (!isRetentionPurged(event)) {
    return;
  }

  for (const question of survey.getAllQuestions(false, false, true)) {
    if (isSpecialCategory(question.getPropertyValue('privacyCategory'))) {
      question.readOnly = true;
      // After the question's own help text, which may still explain it.
      question.description = [question.description, note]
        .filter((part) => !!part)
        .join('\n\n');
    }
  }
}
