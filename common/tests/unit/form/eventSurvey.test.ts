import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { prepareEventSurvey } from '../../../src/form/index.js';
import { fakeEventData } from '../../util/faker.js';

const event = (data: Parameters<typeof fakeEventData>[0] = {}) => ({
  ...fakeEventData({ name: { en: 'Camp', de: 'Lager' }, ...data }),
  id: 'event-1',
});

describe('prepareEventSurvey', () => {
  it('sets the event variables in the given locale', () => {
    const model = new SurveyModel({});
    prepareEventSurvey(model, event(), { locale: 'de-DE' });

    expect(model.locale).toBe('de-DE');
    expect(model.getVariable('event.name')).toBe('Lager');
  });

  it('accepts an underscore locale', () => {
    const model = new SurveyModel({});
    prepareEventSurvey(model, event(), { locale: 'de_DE' });

    expect(model.locale).toBe('de-DE');
  });

  it('resolves the variables again when the locale changes', () => {
    const model = new SurveyModel({});
    prepareEventSurvey(model, event(), { locale: 'en' });
    model.locale = 'de';

    expect(model.getVariable('event.name')).toBe('Lager');
  });

  it('keeps newer event data across a locale change', () => {
    const model = new SurveyModel({});
    const survey = prepareEventSurvey(model, event({ minAge: 8 }), {
      locale: 'en',
    });
    survey.setEvent(event({ minAge: 10 }));
    model.locale = 'de';

    expect(model.getVariable('event.minAge')).toBe(10);
  });

  it('answers for the given group', () => {
    const model = new SurveyModel({});
    prepareEventSurvey(model, event({ countries: ['de', 'fr'] }), {
      group: 'fr',
    });

    expect(model.getVariable('event.group')).toBe('fr');
  });
});
