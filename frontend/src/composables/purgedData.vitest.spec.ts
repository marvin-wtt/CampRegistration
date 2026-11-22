import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import '@camp-registration/common/form';
import { lockPurgedQuestions } from './purgedData';

describe('lockPurgedQuestions', () => {
  const form = {
    elements: [
      { type: 'text', name: 'name' },
      { type: 'comment', name: 'allergies', privacyCategory: 'allergies' },
    ],
  };

  function lock(sensitiveDataPurgedAt: string | null) {
    const survey = new SurveyModel(form);
    lockPurgedQuestions(
      survey,
      {
        form,
        sensitiveDataPurgedAt,
        // Locking starts with the deletion, before it completes.
        sensitiveDataClearedAt: null,
        registrationDataPurgedAt: null,
      },
      'Deleted',
    );
    return survey;
  }

  it('locks and explains special-category questions after the deletion', () => {
    const survey = lock('2026-11-01T00:00:00.000Z');

    expect(survey.getQuestionByName('allergies').readOnly).toBe(true);
    expect(survey.getQuestionByName('allergies').description).toBe('Deleted');
    expect(survey.getQuestionByName('name').readOnly).toBe(false);
  });

  it('changes nothing before it', () => {
    expect(lock(null).getQuestionByName('allergies').readOnly).toBe(false);
  });

  it('keeps the question’s own description before the note', () => {
    const survey = new SurveyModel({
      elements: [
        {
          type: 'comment',
          name: 'allergies',
          description: 'Anything we should know',
          privacyCategory: 'allergies',
        },
      ],
    });
    lockPurgedQuestions(
      survey,
      {
        form,
        sensitiveDataPurgedAt: '2026-11-01T00:00:00.000Z',
        sensitiveDataClearedAt: '2026-11-01T00:00:00.000Z',
        registrationDataPurgedAt: null,
      },
      'Deleted',
    );

    expect(survey.getQuestionByName('allergies').description).toBe(
      'Anything we should know\n\nDeleted',
    );
  });
});
