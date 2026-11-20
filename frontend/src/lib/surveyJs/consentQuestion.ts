import type { SurveyModel } from 'survey-core';
import { extractPrivacyTags } from '@camp-registration/common/form';

/** Wording per form locale, already filled in with the category names. */
export interface ConsentQuestionTexts {
  title: Record<string, string>;
  description: Record<string, string>;
  error: Record<string, string>;
}

/**
 * A consent question covering `categories`, the way the presets ask it
 * (docs/privacy.md, 5): last, shown only once one of the questions it covers
 * has an answer, and then to be agreed to — never preselected. When a covered
 * question sits in a dynamic panel, no form-level condition can see it, so the
 * consent is shown always and left optional; the submission check still holds.
 */
export function consentQuestionJson(
  survey: SurveyModel,
  categories: readonly string[],
  texts: ConsentQuestionTexts,
): { name: string } & Record<string, unknown> {
  const covered = extractPrivacyTags(survey.toJSON()).tagged.filter(
    (question) => categories.includes(question.category),
  );
  // Only top-level questions: a nested one may share its name with another,
  // and the condition could not see it anyway.
  const condition = covered.every((question) => !question.within)
    ? covered
        .map((question) => `{${question.valueName ?? question.name}} notempty`)
        .join(' or ')
    : null;

  return {
    type: 'boolean',
    name: uniqueName(survey, 'consent_privacy_data'),
    privacyConsent: true,
    // The generic wording asks for care during the event.
    privacyConsentPurpose: ['medical_care'],
    privacyConsentFor: [...categories],
    title: localized(texts.title),
    description: localized(texts.description),
    ...(condition
      ? {
          visibleIf: condition,
          requireTrue: true,
          requireTrueErrorText: localized(texts.error),
        }
      : {}),
  };
}

function localized(texts: Record<string, string>): Record<string, string> {
  return { default: texts.en ?? Object.values(texts)[0] ?? '', ...texts };
}

function uniqueName(survey: SurveyModel, base: string): string {
  let name = base;
  for (let index = 2; survey.getQuestionByName(name); index++) {
    name = `${base}_${index.toString()}`;
  }

  return name;
}
