import { describe, expect, it } from 'vitest';
import { SurveyModel, type Question } from 'survey-core';
import '../../../src/form/index.js';
import {
  eventDataTagPrivacyCategory,
  eventDataTagsFor,
} from '../../../src/form/eventDataTypes.js';

function question(json: object): Question {
  const survey = new SurveyModel({ elements: [{ name: 'q', ...json }] });
  return survey.getQuestionByName('q');
}

describe('eventDataTagsFor', () => {
  it('offers the name and single address tags for a plain text question', () => {
    expect(eventDataTagsFor(question({ type: 'text' }))).toEqual(
      expect.arrayContaining([
        'first_name',
        'last_name',
        'phone',
        'street',
        'zip_code',
        'city',
      ]),
    );
  });

  it('offers only fitting tags', () => {
    expect(
      eventDataTagsFor(question({ type: 'text', inputType: 'email' })),
    ).toEqual(['email']);
    expect(eventDataTagsFor(question({ type: 'boolean' }))).toEqual([
      'payment_amount',
    ]);
  });

  it('offers no legacy tag', () => {
    expect(eventDataTagsFor(question({ type: 'text' }))).not.toContain('name');
    expect(
      eventDataTagsFor(question({ type: 'expression', expression: '1' })),
    ).not.toContain('name');
  });

  it('offers every current tag for an expression', () => {
    expect(
      eventDataTagsFor(question({ type: 'expression', expression: '1' })),
    ).toEqual(expect.arrayContaining(['address', 'role', 'payment_amount']));
  });
});

describe('eventDataTagPrivacyCategory', () => {
  it('maps a tag to the data category it suggests', () => {
    expect(eventDataTagPrivacyCategory('email')).toBe('contact');
    expect(eventDataTagPrivacyCategory('city')).toBe('address');
    // Still suggested for forms tagged before it was retired.
    expect(eventDataTagPrivacyCategory('name')).toBe('identity');
  });

  it('suggests nothing for other tags', () => {
    expect(eventDataTagPrivacyCategory('payment_amount')).toBeUndefined();
    expect(eventDataTagPrivacyCategory('waiting_list')).toBeUndefined();
    expect(eventDataTagPrivacyCategory('toString')).toBeUndefined();
  });
});
