import { describe, expect, it, vi } from 'vitest';
import { SurveyCreatorModel } from 'survey-creator-core';
import type { Question } from 'survey-core';
import '@camp-registration/common/form';
import type { ComposedPrivacyNotice } from '@camp-registration/common/privacy';
import { attachPrivacyIssues, type PrivacyIssueOptions } from './privacyIssues';

// Declares no data categories, so every tag is undeclared.
const builderNotice = {
  mode: 'builder',
  dataCategories: [],
} as unknown as ComposedPrivacyNotice;

function setup(elements: unknown[]) {
  const creator = new SurveyCreatorModel({});
  creator.JSON = { pages: [{ name: 'page1', elements }] };

  const options: PrivacyIssueOptions = {
    message: ({ kind, category, column }) =>
      [kind, category, column].filter(Boolean).join(':'),
    action: (kind) => `action:${kind}`,
    consentTexts: () => ({
      title: { en: 'Consent' },
      description: { en: '' },
      error: { en: '' },
    }),
    openPrivacySettings: vi.fn(),
  };
  const privacy = attachPrivacyIssues(creator, options);

  const panelOf = (name: string) => {
    const question = creator.survey.getQuestionByName(name);
    const panel = {
      question,
      messageText: '',
      actionText: '',
      onClick: () => undefined,
    };
    creator.onCreateCustomMessagePanel.fire(creator, panel);
    return panel;
  };
  const marked = (name: string) =>
    !!creator.survey
      .getQuestionByName(name)
      .getPropertyValue('isMessagePanelVisible');

  return { creator, privacy, options, panelOf, marked };
}

const allergies = {
  type: 'comment',
  name: 'allergies',
  privacyCategory: 'health',
};

describe('attachPrivacyIssues', () => {
  it('marks nothing before the notice is known', () => {
    const { privacy, marked } = setup([allergies]);

    privacy.refresh();

    expect(marked('allergies')).toBe(false);
  });

  it('marks a question no consent covers and offers one for its category', () => {
    const { creator, privacy, panelOf, marked } = setup([
      allergies,
      { type: 'text', name: 'faith', privacyCategory: 'religion' },
    ]);

    // A free-text notice: every special category relies on consent.
    privacy.setNotice(null);
    const panel = panelOf('allergies');

    expect(marked('allergies')).toBe(true);
    expect(panel).toMatchObject({
      messageText: 'uncovered:health',
      actionText: 'action:uncovered',
    });

    panel.onClick();

    const consents = creator.survey
      .getAllQuestions()
      .filter((question: Question) =>
        question.getPropertyValue('privacyConsent'),
      );
    expect(consents).toHaveLength(1);
    // SurveyJS wraps arrays; compare the items.
    expect([
      ...(consents[0]?.getPropertyValue('privacyConsentFor') as string[]),
    ]).toEqual(['health']);
    expect(marked('allergies')).toBe(false);
    // Unrelated purposes stay separate.
    expect(marked('faith')).toBe(true);
  });

  it('links an undeclared category to the privacy settings', () => {
    const { privacy, options, panelOf } = setup([allergies]);

    privacy.setNotice(builderNotice);
    const panel = panelOf('allergies');
    panel.onClick();

    expect(panel.messageText).toBe('undeclared:health');
    expect(options.openPrivacySettings).toHaveBeenCalled();
  });

  it('marks a matrix for its tagged column', () => {
    const { privacy, panelOf, marked } = setup([
      {
        type: 'matrixdynamic',
        name: 'kids',
        columns: [
          { name: 'name' },
          { name: 'meds', title: 'Medication', privacyCategory: 'health' },
        ],
      },
    ]);

    privacy.setNotice(null);

    expect(marked('kids')).toBe(true);
    expect(panelOf('kids').messageText).toBe('uncovered:health:Medication');
  });
});
