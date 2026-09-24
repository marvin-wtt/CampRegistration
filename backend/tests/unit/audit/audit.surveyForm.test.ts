import { describe, expect, it } from 'vitest';
import { formFieldChanges } from '#app/audit/audit.surveyForm';

const form = (title: string, questionTitle: string) => ({
  pages: [
    {
      name: 'p1',
      title,
      elements: [{ type: 'text', name: 'a', title: questionTitle }],
    },
  ],
});

describe('formFieldChanges', () => {
  it('names the questions that changed', () => {
    expect(formFieldChanges(form('Page', 'A'), form('Page', 'B'))).toEqual([
      'form.a',
    ]);
  });

  it('reports the form itself when only non-question parts changed', () => {
    expect(formFieldChanges(form('Page', 'A'), form('Other', 'A'))).toEqual([
      'form',
    ]);
  });

  it('reports nothing for an identical form', () => {
    expect(formFieldChanges(form('Page', 'A'), form('Page', 'A'))).toEqual([]);
  });
});
