import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { fakeCampData } from '../../util/faker';
import { setVariables } from '../../../src/form';

describe('variables', () => {
  describe('translations', () => {
    it('should translate to the given locale', () => {
      const model = new SurveyModel();

      const data = fakeCampData({
        name: {
          fr: 'Failed',
          de: 'Test 123',
        },
      });

      model.locale = 'de';
      setVariables(model, data);

      expect(model.getVariable('camp.name')).toBe('Test 123');
    });

    it('should translate to the given short locale', () => {
      const model = new SurveyModel();

      const data = fakeCampData({
        name: {
          fr: 'Failed',
          de: 'Test 123',
        },
      });

      model.locale = 'de-DE';
      setVariables(model, data);

      expect(model.getVariable('camp.name')).toBe('Test 123');
    });

    it('should translate to the fallback locale if locale is missing', () => {
      const model = new SurveyModel();

      const data = fakeCampData({
        name: {
          fr: 'Failed',
          en: 'Test 123',
        },
      });

      model.locale = 'de';
      setVariables(model, data);

      expect(model.getVariable('camp.name')).toBe('Test 123');
    });

    it('should translate to anything if locale and fallback are both missing', () => {
      const model = new SurveyModel();

      const data = fakeCampData({
        name: {
          de: 'Test 123',
        },
      });

      model.locale = 'en';
      setVariables(model, data);

      expect(model.getVariable('camp.name')).toBe('Test 123');
    });
  });

  describe('dates', () => {
    it('should set the date for a given locale', () => {
      const model = new SurveyModel();

      const data = fakeCampData({
        startAt: new Date('2000-01-01'),
      });

      model.locale = 'de';
      setVariables(model, data);

      expect(model.getVariable('camp.startAtDate')).toBe('01.01.2000');
    });

    it('should use the fallback locale if the given locale is invalid', () => {
      const model = new SurveyModel();

      const data = fakeCampData({
        startAt: new Date('2000-01-10'),
      });

      model.locale = 'test';
      setVariables(model, data);

      expect(model.getVariable('camp.startAtDate')).toBe('01/10/2000');
    });
  });

  describe('helpers', () => {
    it('should set `validationEnabled`', () => {
      const model = new SurveyModel();

      setVariables(model, fakeCampData());

      expect(model.getVariable('_validationEnabled')).toBe(true);

      model.validationEnabled = false;

      setVariables(model, fakeCampData());

      expect(model.getVariable('_validationEnabled')).toBe(false);
    });
  });
});
