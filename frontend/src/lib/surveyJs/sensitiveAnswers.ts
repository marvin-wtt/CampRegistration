import { SurveyModel, type Question } from 'survey-core';
import {
  buildFieldIndex,
  isSpecialCategory,
  privacyCategoryOf,
  specialCategoryFieldTest,
} from '@camp-registration/common/form';

/**
 * The special-category questions of the saved form whose stored answers the
 * edited form would no longer treat as sensitive: deleted, untagged, renamed
 * or moved (docs/privacy.md, 5, "Form changes after registrations exist").
 * Every stored path of the saved form is checked against the edited one with
 * the purge's own test, so a type change or another special category, which
 * keep the answers sensitive, is no loss.
 */
export function lostSensitiveQuestions(
  saved: object,
  edited: object,
  /** The locale their titles are read in. */
  locale?: string,
): Question[] {
  const stillSensitive = specialCategoryFieldTest(edited);
  const lost = new Map<string, Question>();
  const model = new SurveyModel(saved);
  if (locale) {
    model.locale = locale;
  }

  for (const [path, question] of buildFieldIndex(model)) {
    if (
      isSpecialCategory(privacyCategoryOf(question)) &&
      !stillSensitive(path)
    ) {
      lost.set(question.id, question);
    }
  }
  return [...lost.values()];
}
