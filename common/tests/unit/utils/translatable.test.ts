import { describe, expect, it } from 'vitest';
import {
  eventGroup,
  eventGroupFields,
  forGroup,
  sumGroupValues,
  translate,
} from '../../../src/utils/translatable.js';
import { localeForCountry, localesForCountries } from '../../../src/locales.js';

describe('translate', () => {
  it('should prefer the exact locale, then its language', () => {
    expect(translate({ 'de-AT': 'Servus', de: 'Hallo' }, 'de-AT')).toBe(
      'Servus',
    );
    expect(translate({ de: 'Hallo', en: 'Hello' }, 'de-AT')).toBe('Hallo');
  });

  it('should fall back to the fallback locale, then to any value', () => {
    expect(translate({ fr: 'Salut', en: 'Hello' }, 'pl')).toBe('Hello');
    expect(translate({ fr: 'Salut' }, 'pl')).toBe('Salut');
  });

  it('should pass a plain value through', () => {
    expect(translate('Hello', 'de')).toBe('Hello');
    expect(translate(null, 'de')).toBeUndefined();
  });
});

describe('forGroup', () => {
  it("should return the country's value", () => {
    expect(forGroup({ de: 10, fr: 5 }, 'fr')).toBe(5);
    expect(forGroup({ de: 10, fr: 5 }, 'FR')).toBe(5);
  });

  it("should not guess another country's value", () => {
    expect(forGroup({ de: 10, fr: 5 }, 'pl')).toBeUndefined();
    expect(forGroup({ de: 10, fr: 5 }, null)).toBeUndefined();
  });

  it('should resolve a value that is the same in every country', () => {
    expect(forGroup(12, 'de')).toBe(12);
    expect(forGroup({ de: 10, fr: 10 }, null)).toBe(10);
  });
});

describe('eventGroup', () => {
  it('should prefer the selected country', () => {
    expect(eventGroup({ countries: ['de', 'fr'] }, 'FR')).toBe('fr');
  });

  it("should fall back to the event's only country", () => {
    expect(eventGroup({ countries: ['gb'] }, null)).toBe('gb');
    expect(eventGroup({ countries: ['de', 'fr'] }, undefined)).toBeNull();
  });

  it("should ignore a selection the event doesn't run in", () => {
    expect(eventGroup({ countries: ['de'] }, 'at')).toBe('de');
    expect(eventGroup({ countries: ['de', 'fr'] }, 'at')).toBeNull();
  });
});

describe('country locales', () => {
  it('should map countries to the language they write in', () => {
    expect(localeForCountry('gb')).toBe('en');
    expect(localeForCountry('CZ')).toBe('cs');
    expect(localeForCountry('xx')).toBe('en');
  });

  it('should list the locales of several countries once, in app order', () => {
    expect(localesForCountries(['us', 'cz', 'gb', 'de'])).toEqual([
      'en',
      'de',
      'cs',
    ]);
  });
});

describe('sumGroupValues', () => {
  it('should count countries with the same value each', () => {
    expect(sumGroupValues({ de: 10, fr: 10 })).toBe(20);
    expect(sumGroupValues(12)).toBe(12);
  });
});

describe('eventGroupFields', () => {
  const event = {
    organizer: { de: 'Verein', fr: 'Association' },
    contactEmail: { de: 'de@test', fr: 'fr@test' },
    maxParticipants: { de: 10, fr: 10 },
    freePlaces: { de: 3, fr: 0 },
  };

  it('should resolve every field for the country', () => {
    expect(eventGroupFields(event, 'fr')).toEqual({
      organizer: 'Association',
      contactEmail: 'fr@test',
      maxParticipants: 10,
      freePlaces: 0,
    });
  });

  it('should cover every country without one, but never guess free places', () => {
    expect(eventGroupFields(event, null)).toEqual({
      organizer: 'Verein / Association',
      contactEmail: 'de@test, fr@test',
      maxParticipants: 20,
      freePlaces: null,
    });
  });

  it('should treat a country the event has no value for like no country', () => {
    expect(eventGroupFields(event, 'pl')).toMatchObject({
      organizer: 'Verein / Association',
      freePlaces: null,
    });
  });
});
