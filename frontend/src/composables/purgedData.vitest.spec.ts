import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import '@camp-registration/common/form';
import type { EventDetails } from '@camp-registration/common/entities';
import { lockPurgedQuestions, reachesAnswerKey } from './purgedData';

describe('reachesAnswerKey', () => {
  const keys = new Set(['allergies', 'kids.meds']);

  it('matches form answers, also nested ones', () => {
    expect(reachesAnswerKey('data.allergies', keys)).toBe(true);
    expect(reachesAnswerKey('data.kids[0].meds', keys)).toBe(true);
    expect(reachesAnswerKey('data.kids.meds', keys)).toBe(true);
    expect(reachesAnswerKey('data.allergies.other', keys)).toBe(true);
  });

  it('matches whole paths, not a name that recurs elsewhere', () => {
    expect(reachesAnswerKey('data.meds', keys)).toBe(false);
    expect(reachesAnswerKey('data.parents[0].meds', keys)).toBe(false);
    expect(reachesAnswerKey('data.kids', keys)).toBe(false);
  });

  it('matches the rows of a dropdown matrix by any name', () => {
    const rows = new Set(['kids.*.meds']);

    expect(reachesAnswerKey('data.kids.anna.meds', rows)).toBe(true);
    expect(reachesAnswerKey('data.kids.1.meds', rows)).toBe(true);
    expect(reachesAnswerKey('data.kids.anna.name', rows)).toBe(false);
  });

  it('ignores other answers and data outside the form', () => {
    expect(reachesAnswerKey('data.name', keys)).toBe(false);
    expect(reachesAnswerKey('customData.allergies', keys)).toBe(false);
    expect(reachesAnswerKey('allergies', keys)).toBe(false);
  });
});

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
        form: form as unknown as EventDetails['form'],
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
        form: form as unknown as EventDetails['form'],
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
