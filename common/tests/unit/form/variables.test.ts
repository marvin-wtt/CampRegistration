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

  describe('files', () => {
    const getFileUrl = (id: string) => `https://example.com/files/${id}`;

    it('should set _file variable with resolved URLs', () => {
      const model = new SurveyModel();
      model.locale = 'de';

      const files = [{ id: 'file-1', field: 'rules', locale: 'de' }];

      setVariables(model, fakeCampData(), getFileUrl, files);

      expect(model.getVariable('_file')).toEqual({
        rules: 'https://example.com/files/file-1',
      });
    });

    it('should prefer exact locale match', () => {
      const model = new SurveyModel();
      model.locale = 'de-DE';

      const files = [
        { id: 'default', field: 'rules', locale: null },
        { id: 'german', field: 'rules', locale: 'de' },
        { id: 'german-exact', field: 'rules', locale: 'de-DE' },
      ];

      setVariables(model, fakeCampData(), getFileUrl, files);

      expect(model.getVariable('_file')).toEqual({
        rules: 'https://example.com/files/german-exact',
      });
    });

    it('should fall back to language prefix when exact locale is missing', () => {
      const model = new SurveyModel();
      model.locale = 'de-DE';

      const files = [
        { id: 'default', field: 'rules', locale: null },
        { id: 'german', field: 'rules', locale: 'de' },
      ];

      setVariables(model, fakeCampData(), getFileUrl, files);

      expect(model.getVariable('_file')).toEqual({
        rules: 'https://example.com/files/german',
      });
    });

    it('should fall back to null-locale file when no locale matches', () => {
      const model = new SurveyModel();
      model.locale = 'fr';

      const files = [{ id: 'default', field: 'rules', locale: null }];

      setVariables(model, fakeCampData(), getFileUrl, files);

      expect(model.getVariable('_file')).toEqual({
        rules: 'https://example.com/files/default',
      });
    });

    it('should exclude files that do not match the locale at all', () => {
      const model = new SurveyModel();
      model.locale = 'fr';

      const files = [{ id: 'german', field: 'rules', locale: 'de' }];

      setVariables(model, fakeCampData(), getFileUrl, files);

      expect(model.getVariable('_file')).toBeUndefined();
    });

    it('should handle multiple fields independently', () => {
      const model = new SurveyModel();
      model.locale = 'de';

      const files = [
        { id: 'rules-de', field: 'rules', locale: 'de' },
        { id: 'toc-de', field: 'toc', locale: 'de' },
      ];

      setVariables(model, fakeCampData(), getFileUrl, files);

      expect(model.getVariable('_file')).toEqual({
        rules: 'https://example.com/files/rules-de',
        toc: 'https://example.com/files/toc-de',
      });
    });

    it('should not set _file when getFileUrl is not provided', () => {
      const model = new SurveyModel();

      const files = [{ id: 'file-1', field: 'rules', locale: null }];

      setVariables(model, fakeCampData(), undefined, files);

      expect(model.getVariable('_file')).toBeUndefined();
    });

    it('should not set _file when files array is empty', () => {
      const model = new SurveyModel();

      setVariables(model, fakeCampData(), getFileUrl, []);

      expect(model.getVariable('_file')).toBeUndefined();
    });

    it('should not set _file when files are not provided', () => {
      const model = new SurveyModel();

      setVariables(model, fakeCampData(), getFileUrl);

      expect(model.getVariable('_file')).toBeUndefined();
    });
  });
});
