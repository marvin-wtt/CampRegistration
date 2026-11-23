import { describe, expect, it } from 'vitest';
import { lostSensitiveQuestions } from './sensitiveAnswers';

const form = (elements: unknown[]) => ({
  pages: [{ name: 'page1', elements }],
});

const allergies = {
  type: 'comment',
  name: 'allergies',
  privacyCategory: 'allergies',
};

const names = (saved: object, edited: object) =>
  lostSensitiveQuestions(saved, edited).map((question) => question.name);

describe('lostSensitiveQuestions', () => {
  const saved = form([allergies]);

  it('reports a deleted question', () => {
    expect(names(saved, form([]))).toEqual(['allergies']);
  });

  it('reports a removed or non-special tag', () => {
    const untagged = { type: allergies.type, name: allergies.name };
    expect(names(saved, form([untagged]))).toEqual(['allergies']);
    expect(
      names(saved, form([{ ...allergies, privacyCategory: 'contact' }])),
    ).toEqual(['allergies']);
  });

  it('reports a renamed storage key', () => {
    expect(names(saved, form([{ ...allergies, name: 'other' }]))).toEqual([
      'allergies',
    ]);
    expect(names(saved, form([{ ...allergies, valueName: 'other' }]))).toEqual([
      'allergies',
    ]);
  });

  it('reports a move into a dynamic panel', () => {
    const edited = form([
      { type: 'paneldynamic', name: 'kids', templateElements: [allergies] },
    ]);
    expect(names(saved, edited)).toEqual(['allergies']);
  });

  it('keeps a type change, another special category and hiding', () => {
    expect(names(saved, form([{ ...allergies, type: 'text' }]))).toEqual([]);
    expect(
      names(saved, form([{ ...allergies, privacyCategory: 'health' }])),
    ).toEqual([]);
    expect(names(saved, form([{ ...allergies, visible: false }]))).toEqual([]);
  });

  it('keeps a move between plain panels', () => {
    const edited = form([
      { type: 'panel', name: 'health', elements: [allergies] },
    ]);
    expect(names(saved, edited)).toEqual([]);
  });

  it('ignores questions that were never special', () => {
    const saved = form([
      { type: 'text', name: 'email', privacyCategory: 'contact' },
    ]);
    expect(names(saved, form([]))).toEqual([]);
  });
});
