import { describe, expect, it } from 'vitest';
import {
  CAMP_PRESETS,
  getCampPreset,
  type Preset,
} from '#app/camp/presets/index';

const PRESETS: Preset[] = ['standard', 'minimal'];
const TRANSLATED_KEYS = ['en', 'de', 'fr', 'pl', 'cs', 'es', 'default'];

/** Every locale key used anywhere in a preset's JSON. */
function localeKeys(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((entry) => localeKeys(entry, found));
    return found;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      if (TRANSLATED_KEYS.includes(key)) {
        found.add(key);
      }
      localeKeys(entry, found);
    }
  }

  return found;
}

/** The first element carrying the given `name`, at any depth. */
function findElement(
  value: unknown,
  name: string,
): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = findElement(entry, name);
      if (match) {
        return match;
      }
    }
    return undefined;
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if (record.name === name) {
      return record;
    }
    for (const entry of Object.values(record)) {
      const match = findElement(entry, name);
      if (match) {
        return match;
      }
    }
  }

  return undefined;
}

describe('getCampPreset', () => {
  it('returns the preset untouched when no locales are requested', () => {
    expect(getCampPreset('standard')).toEqual(CAMP_PRESETS.standard);
    expect(getCampPreset('standard', [])).toEqual(CAMP_PRESETS.standard);
  });

  it('defaults to the standard preset', () => {
    expect(getCampPreset(null)).toEqual(CAMP_PRESETS.standard);
    expect(getCampPreset(undefined)).toEqual(CAMP_PRESETS.standard);
  });

  describe('form', () => {
    it.each(PRESETS)('ships every locale before filtering (%s)', (preset) => {
      expect(localeKeys(CAMP_PRESETS[preset].form)).toEqual(
        new Set(['en', 'de', 'fr', 'pl', 'cs', 'default']),
      );
    });

    it.each(PRESETS)('keeps only the requested locale (%s)', (preset) => {
      const { form } = getCampPreset(preset, ['de']);

      expect(localeKeys(form)).toEqual(new Set(['de', 'default']));
    });

    it.each(PRESETS)('keeps every requested locale (%s)', (preset) => {
      const { form } = getCampPreset(preset, ['de', 'fr']);

      expect(localeKeys(form)).toEqual(new Set(['de', 'fr', 'default']));
    });

    it('keeps the text of the requested locale, not of a dropped one', () => {
      const date = findElement(
        getCampPreset('standard', ['fr']).form,
        'i_date',
      );

      // A single remaining locale collapses into a plain string, so assert on
      // the description, which keeps its `default` sibling and stays an object.
      expect(date?.description).toEqual({
        fr: '{camp.startAtDate} au {camp.endAtDate}',
        default: '{camp.startAtDate} until {camp.endAtDate}',
      });
    });

    it('preserves the untranslated default alongside the requested locale', () => {
      const age = findElement(getCampPreset('standard', ['cs']).form, 'i_age');

      expect(age?.title).toEqual({ cs: 'Věk', default: 'Age' });
    });

    it('falls back to the default text for a locale the preset has no translations for', () => {
      const { form } = getCampPreset('standard', ['es']);

      // `default` is the only survivor, so SurveyJS serialises it as a plain
      // string. Dropping it as well would leave the question without any text
      // at all.
      expect(localeKeys(form)).toEqual(new Set());
      expect(findElement(form, 'i_age')?.title).toBe('Age');
    });
  });

  describe('table templates', () => {
    it.each(PRESETS)('keeps only the requested locales (%s)', (preset) => {
      const { tableTemplates } = getCampPreset(preset, ['de', 'pl']);

      expect(localeKeys(tableTemplates)).toEqual(new Set(['de', 'pl']));
    });

    it('filters titles and column labels alike', () => {
      const [template] = getCampPreset('standard', ['de']).tableTemplates;

      expect(template?.title).toEqual({ de: 'Übersicht' });
      expect(template?.columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'first_name',
            label: { de: 'Vorname' },
          }),
        ]),
      );
    });

    it('keeps every translation when none of the requested locales are present', () => {
      const [template] = getCampPreset('standard', ['es']).tableTemplates;

      expect(template?.title).toEqual(
        CAMP_PRESETS.standard.tableTemplates[0]?.title,
      );
    });
  });
});
