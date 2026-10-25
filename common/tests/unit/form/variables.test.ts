import { describe, expect, it, vi } from 'vitest';
import { SurveyModel } from 'survey-core';
import { fakeEventData } from '../../util/faker.js';
import { setVariables } from '../../../src/form/index.js';
import { naiveDateTimeToUtcCarrier } from '../../../src/utils/index.js';
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

  describe('per-country values', () => {
    const event: Partial<Data> = {
      countries: ['de', 'fr'],
      organizer: { de: 'Verein', fr: 'Association' },
      contactEmail: { de: 'de@test', fr: 'fr@test' },
      maxParticipants: { de: 10, fr: 5 },
      freePlaces: { de: 3, fr: 0 },
    };

    it('should leave them unresolved without a group', () => {
      const model = new SurveyModel();

      setVariables(model, fakeEventData(event));

      expect(model.getVariable('event.country')).toBeNull();
      expect(model.getVariable('event.freePlaces')).toBeNull();
      expect(model.getVariable('event.organizer')).toBe('Verein / Association');
      expect(model.getVariable('event.contactEmail')).toBe('de@test, fr@test');
      expect(model.getVariable('event.maxParticipants')).toBe(15);
    });

    it('should pick up new event data for the group', () => {
      const model = new SurveyModel();
      setVariables(model, fakeEventData(event), { country: 'de' });

      setVariables(model, fakeEventData({ ...event, freePlaces: { de: 0 } }), {
        country: 'de',
      });

      expect(model.getVariable('event.freePlaces')).toBe(0);
    });

    // Older forms pass the answer along; the free places are the group's.
    it('should keep forms that pass the free places to isWaitingList working', () => {
      const waitingList = (group: string) => {
        const model = new SurveyModel({
          elements: [{ type: 'country', name: 'country' }],
          calculatedValues: [
            {
              name: 'waitingList',
              expression: 'isWaitingList({event.freePlaces}, {country})',
            },
          ],
        });
        setVariables(model, fakeEventData(event), { country: group });
        return model.getVariable('waitingList') as unknown;
      };

      expect(waitingList('fr')).toBe(true);
      expect(waitingList('de')).toBe(false);
    });

    it('should add nothing to the form JSON', () => {
      const model = new SurveyModel({
        elements: [{ type: 'country', name: 'country' }],
      });

      setVariables(model, fakeEventData(event), { country: 'fr' });

      expect(model.toJSON()).not.toHaveProperty('calculatedValues');
    });
  });

  describe('fixed group', () => {
    const event: Partial<Data> = {
      countries: ['de', 'fr'],
      organizer: { de: 'Verein', fr: 'Association' },
      contactEmail: { de: 'de@test', fr: 'fr@test' },
      maxParticipants: { de: 10, fr: 5 },
      freePlaces: { de: 3, fr: 0 },
    };

    const countryForm = () =>
      new SurveyModel({
        elements: [
          { type: 'country', name: 'country', eventDataType: 'country' },
        ],
      });

    it('should resolve the per-country values for the given group', () => {
      const model = countryForm();

      setVariables(model, fakeEventData(event), { country: 'fr' });

      expect(model.getVariable('event.country')).toBe('fr');
      expect(model.getVariable('event.organizer')).toBe('Association');
      expect(model.getVariable('event.contactEmail')).toBe('fr@test');
      expect(model.getVariable('event.maxParticipants')).toBe(5);
      expect(model.getVariable('event.freePlaces')).toBe(0);
    });

    it('should not follow the answers', () => {
      const model = countryForm();
      setVariables(model, fakeEventData(event), { country: 'fr' });

      model.setValue('country', 'de');

      expect(model.getVariable('event.country')).toBe('fr');
      expect(model.calculatedValues).toHaveLength(0);
    });

    it("should use the event's only country without a group", () => {
      const model = countryForm();

      setVariables(model, fakeEventData({ ...event, countries: ['de'] }), {
        country: null,
      });

      expect(model.getVariable('event.country')).toBe('de');
    });

    it('should ignore a group the event does not run', () => {
      const model = countryForm();

      setVariables(model, fakeEventData(event), { country: 'it' });

      expect(model.getVariable('event.country')).toBeNull();
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

    it("should read the backend's UTC carriers like the frontend's naive strings", () => {
      // Off UTC, a carrier read in local time would shift its digits.
      vi.stubEnv('TZ', 'America/New_York');
      const startAt = '2026-07-01T00:30:00';
      const endAt = '2026-07-14T23:30:00';
      const variables = (dates: Pick<Data, 'startAt' | 'endAt'>) => {
        const model = new SurveyModel();
        model.locale = 'de';
        setVariables(model, fakeEventData(dates));

        return [
          'startAt',
          'startAtDate',
          'startAtTime',
          'endAt',
          'endAtTime',
        ].map((name) => model.getVariable(`event.${name}`));
      };

      const carried = variables({
        startAt: naiveDateTimeToUtcCarrier(startAt),
        endAt: naiveDateTimeToUtcCarrier(endAt),
      });

      vi.unstubAllEnvs();
      expect(carried).toEqual(variables({ startAt, endAt }));
      expect(carried).toEqual([startAt, '01.07.2026', '00:30', endAt, '23:30']);
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
