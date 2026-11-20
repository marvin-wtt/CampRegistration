import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { consentQuestionJson } from './consentQuestion';

const texts = {
  title: { en: 'I agree.', de: 'Ich willige ein.' },
  description: { en: 'Voluntary.', de: 'Freiwillig.' },
  error: { en: 'Please agree.', de: 'Bitte willige ein.' },
};

describe('consentQuestionJson', () => {
  it('asks only once a covered question is answered, then requires it', () => {
    const survey = new SurveyModel({
      elements: [
        { type: 'comment', name: 'allergies', privacyCategory: 'allergies' },
        { type: 'comment', name: 'medication', privacyCategory: 'medication' },
        { type: 'text', name: 'first_name' },
      ],
    });

    expect(consentQuestionJson(survey, ['allergies'], texts)).toEqual({
      type: 'boolean',
      name: 'consent_privacy_data',
      privacyConsent: true,
      privacyConsentPurpose: ['medical_care'],
      privacyConsentFor: ['allergies'],
      title: { default: 'I agree.', ...texts.title },
      description: { default: 'Voluntary.', ...texts.description },
      visibleIf: '{allergies} notempty',
      requireTrue: true,
      requireTrueErrorText: { default: 'Please agree.', ...texts.error },
    });
  });

  it('stays visible and optional when a covered question is repeated', () => {
    const survey = new SurveyModel({
      elements: [
        {
          type: 'paneldynamic',
          name: 'children',
          templateElements: [
            {
              type: 'comment',
              name: 'allergies',
              privacyCategory: 'allergies',
            },
          ],
        },
      ],
    });

    const json = consentQuestionJson(survey, ['allergies'], texts);

    expect(json).not.toHaveProperty('visibleIf');
    expect(json).not.toHaveProperty('requireTrue');
  });

  it('picks a name no question uses yet', () => {
    const survey = new SurveyModel({
      elements: [{ type: 'boolean', name: 'consent_privacy_data' }],
    });

    expect(consentQuestionJson(survey, ['health'], texts).name).toBe(
      'consent_privacy_data_2',
    );
  });
});
