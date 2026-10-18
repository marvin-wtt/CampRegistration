import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { fakeEventData } from '../../util/faker.js';
import { setVariables } from '../../../src/form/index.js';
import type { Data } from '../../../src/form/variables/variables.js';

describe('variables', () => {
  // Relies on patches/survey-core+3.2.1.patch (surveyjs/survey-library#11830)
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

  describe('selected country', () => {
    const event: Partial<Data> = {
      countries: ['de', 'fr'],
      organizer: { de: 'Verein', fr: 'Association' },
      contactEmail: { de: 'de@test', fr: 'fr@test' },
      maxParticipants: { de: 10, fr: 5 },
      freePlaces: { de: 3, fr: 0 },
    };

    const countryForm = (eventDataType: 'country' | 'address') =>
      new SurveyModel({
        elements:
          eventDataType === 'country'
            ? [{ type: 'country', name: 'country', eventDataType }]
            : [{ type: 'address', name: 'address', eventDataType }],
      });

    it('should leave per-country values unresolved until a country is selected', () => {
      const model = countryForm('country');

      setVariables(model, fakeEventData(event));

      expect(model.getVariable('event.country')).toBeNull();
      expect(model.getVariable('event.freePlaces')).toBeNull();
      expect(model.getVariable('event.organizer')).toBe('Verein / Association');
      expect(model.getVariable('event.contactEmail')).toBe('de@test, fr@test');
      expect(model.getVariable('event.maxParticipants')).toBe(15);
    });

    it('should follow the answer of a country question', () => {
      const model = countryForm('country');
      setVariables(model, fakeEventData(event));

      model.setValue('country', 'fr');

      expect(model.getVariable('event.country')).toBe('fr');
      expect(model.getVariable('event.contactEmail')).toBe('fr@test');
      expect(model.getVariable('event.maxParticipants')).toBe(5);
      expect(model.getVariable('event.freePlaces')).toBe(0);
      expect(model.getVariable('event.organizer')).toBe('Association');
    });

    it('should follow the country of an address', () => {
      const model = countryForm('address');
      setVariables(model, fakeEventData(event));

      model.setValue('address', { country: 'de' });

      expect(model.getVariable('event.freePlaces')).toBe(3);
    });

    it("should fall back to the address's country, as the server does", () => {
      const model = new SurveyModel({
        elements: [
          { type: 'country', name: 'country', eventDataType: 'country' },
          { type: 'address', name: 'address', eventDataType: 'address' },
        ],
      });
      setVariables(model, fakeEventData(event));

      model.setValue('address', { country: 'fr' });
      expect(model.getVariable('event.country')).toBe('fr');

      model.setValue('country', 'de');
      expect(model.getVariable('event.country')).toBe('de');

      model.clearValue('country');
      expect(model.getVariable('event.country')).toBe('fr');
    });

    it('should follow data loaded into the form', () => {
      const model = countryForm('address');
      setVariables(model, fakeEventData(event));

      model.data = { address: { country: 'fr' } };
      expect(model.getVariable('event.country')).toBe('fr');

      model.mergeData({ address: { country: 'de' } });
      expect(model.getVariable('event.country')).toBe('de');
    });

    it('should pick up new event data for the selected country', () => {
      const model = countryForm('country');
      setVariables(model, fakeEventData(event));
      model.setValue('country', 'de');

      setVariables(model, fakeEventData({ ...event, freePlaces: { de: 0 } }));

      expect(model.getVariable('event.freePlaces')).toBe(0);
      expect(model.calculatedValues).toHaveLength(1);
    });

    it('should keep forms that pass the free places to isWaitingList working', () => {
      const model = new SurveyModel({
        elements: [
          { type: 'country', name: 'country', eventDataType: 'country' },
        ],
        calculatedValues: [
          {
            name: 'waitingList',
            expression: 'isWaitingList({event.freePlaces}, {country})',
          },
        ],
      });
      setVariables(model, fakeEventData(event));

      model.setValue('country', 'fr');
      expect(model.getVariable('waitingList')).toBe(true);

      model.setValue('country', 'de');
      expect(model.getVariable('waitingList')).toBe(false);
    });

    it("should use the event's only country without a selection", () => {
      const model = new SurveyModel();

      setVariables(
        model,
        fakeEventData({ countries: ['gb'], contactEmail: { gb: 'gb@test' } }),
      );

      expect(model.getVariable('event.country')).toBe('gb');
      expect(model.getVariable('event.contactEmail')).toBe('gb@test');
    });

    it('should not write the country binding into a design surface', () => {
      const model = countryForm('country');
      model.setDesignMode(true);

      setVariables(model, fakeEventData(event));

      expect(model.calculatedValues).toHaveLength(0);
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
