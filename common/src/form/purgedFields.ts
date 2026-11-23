import { SurveyModel, type Question } from 'survey-core';
import { buildFieldIndex, questionAtPath } from './fields.js';
import { isSpecialCategory } from './privacyTags.js';
import { privacyCategoryOf } from './properties/accessors.js';
import { joinPath, PATH_SEPARATOR } from './answerPaths.js';

/**
 * Tells whether a stored field path (`allergies`, `kids.0.meds`,
 * `allergies-Comment`) reaches an answer "Delete sensitive data" clears
 * (docs/privacy.md, 8): one of a special-category question, or stored beneath
 * one. Read off the form, as the purge does.
 */
export function specialCategoryFieldTest(
  form: object,
): (path: string) => boolean {
  const model = new SurveyModel(form);
  const index = buildFieldIndex(model);
  const suffix = model.commentSuffix;

  const isSensitive = (question: Question | undefined) =>
    !!question && isSpecialCategory(privacyCategoryOf(question));

  return (path) => {
    const keys = path.split(PATH_SEPARATOR);

    return keys.some((key, i) => {
      // A question's comment ("Other" text included) is part of its answer.
      const own = key.endsWith(suffix) ? key.slice(0, -suffix.length) : key;
      const prefix = joinPath(...keys.slice(0, i), own);

      return isSensitive(questionAtPath(index, prefix));
    });
  };
}
