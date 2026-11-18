import { describe, expect, it } from 'vitest';
import { Serializer, SurveyModel } from 'survey-core';
import {
  PRIVACY_ENFORCED_SINCE,
  REPEATED,
  consentTexts,
  extractPrivacyTags,
  formPrivacyIssues,
  hasPrivacyIssues,
  isPrivacyEnforced,
  uncoveredConsentCategories,
  unconsentedAnswers,
} from '../../../src/form/index.js';
import { composePrivacyNotice } from '../../../src/privacy/index.js';

const allergies = {
  type: 'comment',
  name: 'allergies',
  privacyCategory: 'allergies',
};
const medication = {
  type: 'comment',
  name: 'medication',
  privacyCategory: 'medication',
};
const healthConsent = {
  type: 'boolean',
  name: 'consent_health',
  consent: true,
  consentFor: ['allergies', 'medication'],
};
const photoConsent = { type: 'boolean', name: 'consent_photos', consent: true };

const consentBased = new Set(['allergies', 'medication', 'health']);

describe('privacy properties', () => {
  it('are registered on the survey serializer', () => {
    expect(Serializer.findProperty('question', 'privacyCategory')).toBeTruthy();
    expect(Serializer.findProperty('boolean', 'consent')).toBeTruthy();
    expect(Serializer.findProperty('boolean', 'consentFor')).toBeTruthy();
  });

  it('survive a round trip through the survey model', () => {
    const json = { elements: [allergies, healthConsent] };

    expect(new SurveyModel(json).toJSON()).toMatchObject({
      pages: [{ elements: [allergies, healthConsent] }],
    });
  });
});

describe('extractPrivacyTags', () => {
  it('finds tagged questions and consents on pages and in panels', () => {
    const tags = extractPrivacyTags({
      pages: [
        {
          elements: [
            { type: 'panel', name: 'p_health', elements: [allergies] },
            healthConsent,
            photoConsent,
          ],
        },
      ],
    });

    expect(tags.tagged).toEqual([
      { name: 'allergies', path: ['allergies'], category: 'allergies' },
    ]);
    expect(tags.consents).toEqual([
      {
        name: 'consent_health',
        path: ['consent_health'],
        categories: ['allergies', 'medication'],
      },
      { name: 'consent_photos', path: ['consent_photos'], categories: [] },
    ]);
  });

  it('steps into each entry of a dynamic panel', () => {
    const tags = extractPrivacyTags({
      elements: [
        {
          type: 'paneldynamic',
          name: 'children',
          templateElements: [allergies],
        },
      ],
    });

    expect(tags.tagged[0]?.path).toEqual(['children', REPEATED, 'allergies']);
  });

  it('reads the value name where one is set', () => {
    const tags = extractPrivacyTags({
      elements: [{ ...allergies, valueName: 'allergy_notes' }],
    });

    expect(tags.tagged[0]?.path).toEqual(['allergy_notes']);
  });

  it('only counts booleans as consents', () => {
    const tags = extractPrivacyTags({
      elements: [{ ...healthConsent, type: 'checkbox' }],
    });

    expect(tags.consents).toEqual([]);
  });
});

describe('uncoveredConsentCategories', () => {
  it('reports a consent-based category no consent covers', () => {
    const tags = extractPrivacyTags({
      elements: [
        allergies,
        { type: 'text', name: 'diet', privacyCategory: 'health' },
        healthConsent,
      ],
    });

    expect(uncoveredConsentCategories(tags, consentBased)).toEqual(['health']);
  });

  it('ignores categories that rest on another basis', () => {
    const tags = extractPrivacyTags({ elements: [allergies] });

    expect(uncoveredConsentCategories(tags, new Set())).toEqual([]);
  });
});

describe('unconsentedAnswers', () => {
  const tags = extractPrivacyTags({
    elements: [allergies, medication, healthConsent],
  });

  it('reports answers given without the covering consent', () => {
    expect(
      unconsentedAnswers(tags, consentBased, { allergies: 'Nuts' }).map(
        (question) => question.name,
      ),
    ).toEqual(['allergies']);
  });

  it('accepts them once the consent is given', () => {
    expect(
      unconsentedAnswers(tags, consentBased, {
        allergies: 'Nuts',
        consent_health: true,
      }),
    ).toEqual([]);
  });

  it('ignores unanswered questions', () => {
    expect(
      unconsentedAnswers(tags, consentBased, { allergies: '', medication: [] }),
    ).toEqual([]);
  });

  it('checks every entry of a dynamic panel', () => {
    const repeated = extractPrivacyTags({
      elements: [
        {
          type: 'paneldynamic',
          name: 'children',
          templateElements: [allergies],
        },
        healthConsent,
      ],
    });

    expect(
      unconsentedAnswers(repeated, consentBased, {
        children: [{ allergies: '' }, { allergies: 'Nuts' }],
      }),
    ).toHaveLength(1);
  });
});

describe('consentTexts', () => {
  const survey = () =>
    new SurveyModel({
      elements: [
        { type: 'text', name: 'first_name' },
        {
          ...healthConsent,
          title: 'I agree for {first_name}.',
          description: 'Voluntary.',
        },
        { ...photoConsent, title: 'Photos of {first_name}.' },
      ],
    });

  it('renders title and description with placeholders filled', () => {
    const model = survey();
    model.data = { first_name: 'Jane', consent_health: true };

    expect(consentTexts(model)).toEqual({
      consent_health: 'I agree for Jane.\n\nVoluntary.',
      consent_photos: 'Photos of Jane.',
    });
  });

  it('keeps only the consents given when asked to', () => {
    const model = survey();
    model.data = { first_name: 'Jane', consent_health: true };

    expect(Object.keys(consentTexts(model, { givenOnly: true }))).toEqual([
      'consent_health',
    ]);
  });
});

describe('formPrivacyIssues', () => {
  const notice = (
    dataCategories: { key: string; specialCategoryBasis?: string }[],
  ) =>
    ({
      ...composePrivacyNotice(null),
      dataCategories,
    }) as ReturnType<typeof composePrivacyNotice>;

  const form = { elements: [allergies, healthConsent] };

  it('passes a tagged category declared and covered', () => {
    expect(
      formPrivacyIssues(
        form,
        notice([
          { key: 'allergies', specialCategoryBasis: 'explicit_consent' },
        ]),
      ),
    ).toEqual({ undeclared: [], uncovered: [] });
  });

  it('reports a tagged category the notice does not declare', () => {
    expect(formPrivacyIssues(form, notice([])).undeclared).toEqual([
      'allergies',
    ]);
  });

  it('needs no consent for a category on another Art. 9 basis', () => {
    const issues = formPrivacyIssues(
      { elements: [allergies] },
      notice([{ key: 'allergies', specialCategoryBasis: 'vital_interests' }]),
    );

    expect(hasPrivacyIssues(issues)).toBe(false);
  });

  it('relies on consent throughout under a free-text notice', () => {
    const freeText = {
      ...composePrivacyNotice(null),
      mode: 'free_text' as const,
    };

    expect(formPrivacyIssues({ elements: [allergies] }, freeText)).toEqual({
      undeclared: [],
      uncovered: ['allergies'],
    });
  });
});

describe('isPrivacyEnforced', () => {
  it('holds for events created since the rules took effect', () => {
    expect(isPrivacyEnforced({ createdAt: PRIVACY_ENFORCED_SINCE })).toBe(true);
    expect(isPrivacyEnforced({ createdAt: '2026-01-01T00:00:00Z' })).toBe(
      false,
    );
    expect(isPrivacyEnforced({ createdAt: null })).toBe(false);
  });
});
