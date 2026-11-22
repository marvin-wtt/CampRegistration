import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import type { EventDetails } from '@camp-registration/common/entities';
import {
  isSpecialCategory,
  privacyCategoryOf,
  specialCategoryFieldTest,
} from '@camp-registration/common/form';
import {
  isRetentionPurged,
  isSensitiveDataCleared,
} from '@camp-registration/common/privacy';
import type { Question, SurveyModel } from 'survey-core';

type PurgeState = Pick<
  EventDetails,
  | 'form'
  | 'sensitiveDataPurgedAt'
  | 'sensitiveDataClearedAt'
  | 'registrationDataPurgedAt'
>;

const FORM_PREFIX = 'data.';

/**
 * The fields whose answers "Delete sensitive data" cleared (docs/privacy.md,
 * 8), read off the current form as the server does when checking edits.
 */
export function usePurgedFields(
  event: MaybeRefOrGetter<PurgeState | null | undefined>,
) {
  const test = computed<((path: string) => boolean) | null>(() => {
    const current = toValue(event);
    // Shown as deleted only once they are: an interrupted run leaves some
    // stored, which the table still shows (locking starts earlier).
    if (!current || !isSensitiveDataCleared(current)) {
      return null;
    }

    return specialCategoryFieldTest(current.form);
  });

  return {
    /** Whether a column field (`data.kids.0.meds`) shows a cleared answer. */
    isPurged: (path: string) =>
      path.startsWith(FORM_PREFIX) &&
      !!test.value?.(path.slice(FORM_PREFIX.length)),
  };
}

/**
 * Locks the questions whose answers were deleted and says why, so a manager
 * doesn't type an answer the server would refuse — in panel entries added
 * later too.
 */
export function lockPurgedQuestions(
  survey: SurveyModel,
  event: PurgeState,
  note: string,
): void {
  if (!isRetentionPurged(event)) {
    return;
  }

  const lock = (questions: Question[]) => {
    for (const question of questions) {
      if (isSpecialCategory(privacyCategoryOf(question))) {
        question.readOnly = true;
        // After the question's own help text, which may still explain it.
        question.description = [question.description, note]
          .filter((part) => !!part)
          .join('\n\n');
      }
    }
  };

  lock(survey.getAllQuestions(false, false, true));
  survey.onDynamicPanelAdded.add((_, options) => {
    lock(options.panel.questions);
  });
}
