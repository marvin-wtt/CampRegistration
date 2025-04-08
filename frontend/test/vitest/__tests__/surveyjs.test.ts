import { describe, it, expect } from 'vitest';
import { ComponentCollection, FunctionFactory } from 'survey-core';
import '@camp-registration/common/form';

describe('surveyjs integration', () => {
  it('should load custom questions', () => {
    expect(
      ComponentCollection.Instance.getCustomQuestionByName('address'),
    ).toBeDefined();
  });

  it('should load custom functions', () => {
    expect(FunctionFactory.Instance.hasFunction('isMinor')).toBe(true);
  });
});
