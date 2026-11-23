import { describe, expect, it } from 'vitest';
import { FunctionFactory, Serializer, SurveyModel } from 'survey-core';
import { registerFormExtensions } from '../../../src/form/index.js';

describe('registerFormExtensions', () => {
  it('has registered everything on import', () => {
    const survey = new SurveyModel({
      elements: [{ type: 'country', name: 'nationality' }],
    });

    expect(survey.getQuestionByName('nationality').getType()).toBe('country');
    expect(FunctionFactory.Instance.hasFunction('isMinor')).toBe(true);
    expect(Serializer.findProperty('question', 'eventDataType')).toBeTruthy();
  });

  it('can run again without breaking anything', () => {
    registerFormExtensions();
    registerFormExtensions();

    const survey = new SurveyModel({
      elements: [
        { type: 'country', name: 'nationality', groupCountryMatch: 'free' },
      ],
    });

    expect(survey.getQuestionByName('nationality').getType()).toBe('country');
    expect(
      survey
        .getQuestionByName('nationality')
        .getPropertyValue('groupCountryMatch'),
    ).toBe('free');
    expect(FunctionFactory.Instance.hasFunction('isMinor')).toBe(true);
  });
});
