import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { fakeEventData } from '../../util/faker.js';
import { setVariables } from '../../../src/form/index.js';

describe('variables', () => {
  // Relies on patches/survey-core+3.1.1.patch (surveyjs/survey-library#11830)
  // until `hasLogo` reads the resolved placeholder upstream.
  describe('logo', () => {
    const logo = 'https://api.test/api/v1/events/1/files/slots/logo';

    it('should resolve the logo placeholder to the event logo', () => {
      const model = new SurveyModel({ logo: '{event.logo}' });

      setVariables(model, fakeEventData({ logo }));

      expect(model.locLogo.renderedHtml).toBe(logo);
      expect(model.hasLogo).toBe(true);
    });

    it('should hide the logo for an event without one', () => {
      const model = new SurveyModel({ logo: '{event.logo}' });

      setVariables(model, fakeEventData({ logo: null }));

      expect(model.hasLogo).toBe(false);
    });

    it('should keep a logo the form carries itself', () => {
      const ownLogo = 'https://example.org/own-logo.png';
      const model = new SurveyModel({ logo: ownLogo });

      setVariables(model, fakeEventData({ logo }));

      expect(model.locLogo.renderedHtml).toBe(ownLogo);
    });

    it('should hide the logo when the event logo is removed', () => {
      const model = new SurveyModel({ logo: '{event.logo}' });

      setVariables(model, fakeEventData({ logo }));
      setVariables(model, fakeEventData({ logo: null }));

      expect(model.hasLogo).toBe(false);
    });
  });

  describe('translations', () => {
    it('should translate to the given locale', () => {
      const model = new SurveyModel();

      const data = fakeEventData({
        name: {
          fr: 'Failed',
          de: 'Test 123',
        },
      });

      model.locale = 'de';
      setVariables(model, data);

      expect(model.getVariable('event.name')).toBe('Test 123');
    });

    it('should translate to the given short locale', () => {
      const model = new SurveyModel();

      const data = fakeEventData({
        name: {
          fr: 'Failed',
          de: 'Test 123',
        },
      });

      model.locale = 'de-DE';
      setVariables(model, data);

      expect(model.getVariable('event.name')).toBe('Test 123');
    });

    it('should translate to the fallback locale if locale is missing', () => {
      const model = new SurveyModel();

      const data = fakeEventData({
        name: {
          fr: 'Failed',
          en: 'Test 123',
        },
      });

      model.locale = 'de';
      setVariables(model, data);

      expect(model.getVariable('event.name')).toBe('Test 123');
    });

    it('should translate to anything if locale and fallback are both missing', () => {
      const model = new SurveyModel();

      const data = fakeEventData({
        name: {
          de: 'Test 123',
        },
      });

      model.locale = 'en';
      setVariables(model, data);

      expect(model.getVariable('event.name')).toBe('Test 123');
    });
  });

  describe('dates', () => {
    it('should set the date for a given locale', () => {
      const model = new SurveyModel();

      const data = fakeEventData({
        startAt: new Date('2000-01-01'),
      });

      model.locale = 'de';
      setVariables(model, data);

      expect(model.getVariable('event.startAtDate')).toBe('01.01.2000');
    });

    it('should use the fallback locale if the given locale is invalid', () => {
      const model = new SurveyModel();

      const data = fakeEventData({
        startAt: new Date('2000-01-10'),
      });

      model.locale = 'test';
      setVariables(model, data);

      expect(model.getVariable('event.startAtDate')).toBe('01/10/2000');
    });
  });

  describe('helpers', () => {
    it('should set `validationEnabled`', () => {
      const model = new SurveyModel();

      setVariables(model, fakeEventData());

      expect(model.getVariable('_validationEnabled')).toBe(true);

      model.validationEnabled = false;

      setVariables(model, fakeEventData());

      expect(model.getVariable('_validationEnabled')).toBe(false);
    });
  });
});
