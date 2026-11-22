import { describe, expect, it } from 'vitest';
import { Serializer, SurveyModel } from 'survey-core';
import {
  consentAnswers,
  consentTexts,
  extractPrivacyTags,
  formPrivacyIssues,
  hasPrivacyIssues,
  uncoveredConsentCategories,
  taggedSpecialCategories,
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
    expect(
      Serializer.findProperty('boolean', 'privacyConsentPurpose'),
    ).toBeTruthy();
  });

  it('offer what a consent unlocks only while the form tags a special category', () => {
    const forProperty = Serializer.findProperty('boolean', 'privacyConsentFor');
    const consentOf = (json: object) =>
      new SurveyModel(json).getQuestionByName('consent');
    const consent = { type: 'boolean', name: 'consent', privacyConsent: true };

    const untagged = consentOf({ elements: [consent] });
    expect(forProperty.isVisible('', untagged)).toBe(false);

    const tagged = consentOf({
      elements: [
        allergies,
        { type: 'comment', name: 'notes', privacyCategory: 'contact' },
        consent,
      ],
    });
    expect(forProperty.isVisible('', tagged)).toBe(true);
    expect(forProperty.getChoices(tagged)).toEqual(['allergies']);
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
      {
        name: 'consent_health',
        categories: ['allergies', 'medication'],
        purposes: [],
      },
      { name: 'consent_photos', categories: [], purposes: [] },
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

    expect(tags.tagged).toEqual([
      { name: 'allergies', nested: true, category: 'allergies' },
    ]);
  });

  it('reads the tags on matrix columns, as SurveyJS gives them to the cells', () => {
    const form = {
      elements: [
        {
          type: 'matrixdynamic',
          name: 'kids',
          columns: [
            { name: 'first_name', cellType: 'text' },
            { name: 'meds', cellType: 'text', privacyCategory: 'medication' },
          ],
        },
      ],
    };
    const fromSurvey = new SurveyModel(form)
      .getAllQuestions(false, false, true)
      .filter((question) => question.getPropertyValue('privacyCategory'))
      .map((question) => question.name);

    expect(extractPrivacyTags(form).tagged).toEqual([
      { name: 'meds', nested: true, category: 'medication' },
    ]);
    expect(new Set(fromSurvey)).toEqual(new Set(['meds']));
  });

  it('marks the columns of a dropdown matrix as nested', () => {
    const tags = extractPrivacyTags({
      elements: [
        {
          type: 'matrixdropdown',
          name: 'kids',
          rows: ['anna', 'ben'],
          columns: [{ name: 'meds', privacyCategory: 'medication' }],
        },
      ],
    });

    expect(tags.tagged).toEqual([
      { name: 'meds', nested: true, category: 'medication' },
    ]);
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

  it('counts a consent asked per entry for the answers in its own entry', () => {
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

    expect(names(model, consentBased)).toEqual([]);
  });

  it('reports an entry whose own consent was declined', () => {
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
        { allergies: 'Milk', consent_health: false },
      ],
    };

    const missing = unconsentedQuestions(model, consentBased);
    expect(missing.map((question) => question.value as unknown)).toEqual([
      'Milk',
    ]);
  });

  it('counts per-entry consents for a top-level answer only when all agree', () => {
    const model = new SurveyModel({
      elements: [
        allergies,
        {
          type: 'paneldynamic',
          name: 'children',
          templateElements: [healthConsent],
        },
      ],
    });
    model.data = {
      allergies: 'Nuts',
      children: [{ consent_health: true }, { consent_health: false }],
    };

    expect(names(model, consentBased)).toEqual(['allergies']);
  });
});

describe('unconsentedQuestions with visibleOnly', () => {
  // Answered, then hidden again: SurveyJS keeps the value until completion.
  const askedIf = (data: Record<string, unknown>, elements: object[]) => {
    const model = new SurveyModel({ elements });
    model.data = data;
    return unconsentedQuestions(model, consentBased, { visibleOnly: true }).map(
      (question) => question.name,
    );
  };
  const hasAllergies = { type: 'boolean', name: 'has_allergies' };
  const shownIfAllergies = { visibleIf: '{has_allergies} = true' };

  it('skips an answer whose question is hidden', () => {
    expect(
      askedIf({ has_allergies: false, allergies: 'Nuts' }, [
        hasAllergies,
        { ...allergies, ...shownIfAllergies },
        { ...healthConsent, ...shownIfAllergies },
      ]),
    ).toEqual([]);
  });

  it('skips an answer inside a hidden panel', () => {
    expect(
      askedIf({ has_allergies: false, allergies: 'Nuts' }, [
        hasAllergies,
        {
          type: 'panel',
          name: 'health',
          ...shownIfAllergies,
          elements: [allergies, healthConsent],
        },
      ]),
    ).toEqual([]);
  });

  it('still reports a visible answer whose consent the form hides', () => {
    expect(
      askedIf({ has_allergies: false, allergies: 'Nuts' }, [
        hasAllergies,
        allergies,
        { ...healthConsent, ...shownIfAllergies },
      ]),
    ).toEqual(['allergies']);
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

  it('keeps the wording of a consent in every dynamic panel entry', () => {
    const model = new SurveyModel({
      elements: [
        {
          type: 'paneldynamic',
          name: 'kids',
          templateElements: [{ ...healthConsent, title: 'For this child.' }],
        },
      ],
    });
    model.data = {
      kids: [{ consent_health: true }, { consent_health: false }],
    };

    expect(consentTexts(model)).toEqual({
      'kids.0.consent_health': 'For this child.',
      'kids.1.consent_health': 'For this child.',
    });
    expect(Object.keys(consentTexts(model, { givenOnly: true }))).toEqual([
      'kids.0.consent_health',
    ]);
  });

  it('fills the entry placeholders and keys nested panels by their path', () => {
    const model = new SurveyModel({
      elements: [
        {
          type: 'paneldynamic',
          name: 'groups',
          templateElements: [
            {
              type: 'paneldynamic',
              name: 'kids',
              templateElements: [
                { type: 'text', name: 'first_name' },
                { ...healthConsent, title: 'For {panel.first_name}.' },
              ],
            },
          ],
        },
      ],
    });
    model.data = {
      groups: [
        { kids: [{ first_name: 'Anna' }] },
        { kids: [{ first_name: 'Ben' }] },
      ],
    };

    expect(consentTexts(model)).toEqual({
      'groups.0.kids.0.consent_health': 'For Anna.',
      'groups.1.kids.0.consent_health': 'For Ben.',
    });
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

describe('consent purposes', () => {
  const newsletter = {
    type: 'boolean',
    name: 'newsletter',
    privacyConsent: true,
    privacyConsentPurpose: ['newsletter'],
  };

  it('are read from the saved form', () => {
    expect(extractPrivacyTags({ elements: [newsletter] }).consents).toEqual([
      { name: 'newsletter', categories: [], purposes: ['newsletter'] },
    ]);
  });

  it('collect the answers of every consent asked for a purpose', () => {
    const survey = new SurveyModel({
      elements: [
        newsletter,
        photoConsent,
        {
          type: 'paneldynamic',
          name: 'kids',
          templateElements: [{ ...newsletter, name: 'kid_newsletter' }],
        },
      ],
    });
    survey.data = {
      newsletter: false,
      consent_photos: true,
      kids: [{ kid_newsletter: true }, {}],
    };

    expect(consentAnswers(survey, 'newsletter')).toEqual([
      false,
      true,
      undefined,
    ]);
    expect(consentAnswers(survey, 'photo_publication')).toEqual([]);
  });

  it('count only on a question marked as consent', () => {
    const survey = new SurveyModel({
      elements: [{ ...newsletter, privacyConsent: false }],
    });
    survey.data = { newsletter: true };

    expect(consentAnswers(survey, 'newsletter')).toEqual([]);
  });
});

describe('taggedSpecialCategories', () => {
  it('lists the special categories the form tags, once each', () => {
    expect(
      taggedSpecialCategories({
        elements: [
          allergies,
          { ...allergies, name: 'more_allergies' },
          medication,
          { type: 'text', name: 'email', privacyCategory: 'contact' },
        ],
      }),
    ).toEqual(['allergies', 'medication']);
  });
});
