import {
  answerPath,
  extractPrivacyTags,
  isSpecialCategory,
  specialCategoryAnswerKeys,
  type PrivacyTaggedQuestion,
} from '@camp-registration/common/form';

/**
 * The special-category questions of the saved form whose answers the edited
 * form no longer stores where they are: deleted, untagged, renamed or moved
 * (docs/privacy.md, 5, "Form changes after registrations exist"). Stored
 * answers there would stop counting as sensitive. A type change or another
 * special category keeps the location, so it is no loss.
 */
export function lostSensitiveQuestions(
  saved: unknown,
  edited: unknown,
): PrivacyTaggedQuestion[] {
  const kept = specialCategoryAnswerKeys(edited);
  return extractPrivacyTags(saved).tagged.filter(
    (question) =>
      isSpecialCategory(question.category) && !kept.has(answerPath(question)),
  );
}
