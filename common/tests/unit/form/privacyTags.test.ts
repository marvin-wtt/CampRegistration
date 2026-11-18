import { describe, expect, it } from 'vitest';
import { Serializer, SurveyModel } from 'survey-core';
import {
  PRIVACY_ENFORCED_SINCE,
  consentTexts,
  extractPrivacyTags,
  formPrivacyIssues,
  hasPrivacyIssues,
  isPrivacyEnforced,
  uncoveredConsentCategories,
  clearUnconsentedAnswers,
  unconsentedQuestions,
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
  privacyConsent: true,
  privacyConsentFor: ['allergies', 'medication'],
};
const photoConsent = {
  type: 'boolean',
  name: 'consent_photos',
  privacyConsent: true,
};

const consentBased = new Set(['allergies', 'medication', 'health']);

describe('privacy properties', () => {
  it('are registered on the survey serializer', () => {
    expect(Serializer.findProperty('question', 'privacyCategory')).toBeTruthy();
    expect(Serializer.findProperty('boolean', 'privacyConsent')).toBeTruthy();
    expect(
      Serializer.findProperty('boolean', 'privacyConsentFor'),
    ).toBeTruthy();
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

    expect(tags.tagged).toEqual([{ name: 'allergies', category: 'allergies' }]);
    expect(tags.consents).toEqual([
      { name: 'consent_health', categories: ['allergies', 'medication'] },
      { name: 'consent_photos', categories: [] },
    ]);
  });

  it('reads the tags inside a dynamic panel', () => {
    const tags = extractPrivacyTags({
      elements: [
        {
          type: 'paneldynamic',
          name: 'children',
          templateElements: [allergies],
        },
      ],
    });

    expect(tags.tagged).toEqual([{ name: 'allergies', category: 'allergies' }]);
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

describe('unconsentedQuestions', () => {
  const survey = (data: Record<string, unknown>, extra: object[] = []) => {
    const model = new SurveyModel({
      elements: [allergies, medication, healthConsent, ...extra],
    });
    model.data = data;
    return model;
  };
  const names = (model: SurveyModel, categories?: Set<string>) =>
    unconsentedQuestions(model, categories).map((q) => q.name);

  it('reports answers given without the covering consent', () => {
    expect(names(survey({ allergies: 'Nuts' }), consentBased)).toEqual([
      'allergies',
    ]);
  });

  it('accepts them once the consent is given', () => {
    expect(
      names(survey({ allergies: 'Nuts', consent_health: true }), consentBased),
    ).toEqual([]);
  });

  it('reports them when the consent is declined', () => {
    expect(
      names(survey({ allergies: 'Nuts', consent_health: false }), consentBased),
    ).toEqual(['allergies']);
  });

  it('ignores unanswered questions', () => {
    expect(names(survey({ allergies: '' }), consentBased)).toEqual([]);
  });

  it('ignores categories resting on another basis', () => {
    expect(names(survey({ allergies: 'Nuts' }), new Set())).toEqual([]);
  });

  it('defaults to the categories the form asks consent for', () => {
    const model = survey({ allergies: 'Nuts', diet: 'x' }, [
      { type: 'text', name: 'diet', privacyCategory: 'religion' },
    ]);

    expect(names(model)).toEqual(['allergies']);
  });

  it('checks every entry of a dynamic panel', () => {
    const model = new SurveyModel({
      elements: [
        {
          type: 'paneldynamic',
          name: 'children',
          templateElements: [allergies],
        },
        healthConsent,
      ],
    });
    model.data = { children: [{ allergies: '' }, { allergies: 'Nuts' }] };

    expect(names(model, consentBased)).toEqual(['allergies']);
  });

  it('counts a consent asked per entry only when given in every entry', () => {
    const model = new SurveyModel({
      elements: [
        {
          type: 'paneldynamic',
          name: 'children',
          templateElements: [allergies, healthConsent],
        },
      ],
    });
    model.data = {
      children: [
        { allergies: 'Nuts', consent_health: true },
        { consent_health: false },
      ],
    };

    expect(names(model, consentBased)).toEqual(['allergies']);
  });
});

describe('clearUnconsentedAnswers', () => {
  it('clears what a declined consent covers, comments included', () => {
    const model = new SurveyModel({
      elements: [
        {
          type: 'checkbox',
          name: 'allergies',
          privacyCategory: 'allergies',
          choices: ['nuts'],
          showOtherItem: true,
        },
        { type: 'text', name: 'first_name' },
        healthConsent,
      ],
    });
    model.data = {
      first_name: 'Jane',
      allergies: ['nuts', 'other'],
      'allergies-Comment': 'milk',
      consent_health: false,
    };

    clearUnconsentedAnswers(model);

    expect(model.data).toEqual({ first_name: 'Jane', consent_health: false });
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
