import { describe, expect, it } from 'vitest';
import { EVENT_PRESET_NAMES } from '@camp-registration/common/entities';
import {
  EVENT_PRESETS,
  defaultMessageTemplatesForCountries,
  defaultSettingsForPreset,
  getEventPreset,
} from '#app/event/presets/index';

const PRESETS = EVENT_PRESET_NAMES;
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

describe('getEventPreset', () => {
  it('returns the preset untouched when no locales are requested', () => {
    expect(getEventPreset('camp')).toEqual(EVENT_PRESETS.camp);
    expect(getEventPreset('camp', [])).toEqual(EVENT_PRESETS.camp);
  });

  it('defaults to the camp preset', () => {
    expect(getEventPreset(null)).toEqual(EVENT_PRESETS.camp);
    expect(getEventPreset(undefined)).toEqual(EVENT_PRESETS.camp);
  });

  describe('form', () => {
    it.each(PRESETS)('ships every locale before filtering (%s)', (preset) => {
      expect(localeKeys(EVENT_PRESETS[preset].form)).toEqual(
        new Set(['en', 'de', 'fr', 'pl', 'cs', 'default']),
      );
    });

    it.each(PRESETS)('keeps only the requested locale (%s)', (preset) => {
      const { form } = getEventPreset(preset, ['de']);

      expect(localeKeys(form)).toEqual(new Set(['de', 'default']));
    });

    it.each(PRESETS)('keeps every requested locale (%s)', (preset) => {
      const { form } = getEventPreset(preset, ['de', 'fr']);

      expect(localeKeys(form)).toEqual(new Set(['de', 'fr', 'default']));
    });

    it('keeps the text of the requested locale, not of a dropped one', () => {
      const date = findElement(getEventPreset('camp', ['fr']).form, 'i_date');

      // A single remaining locale collapses into a plain string, so assert on
      // the description, which keeps its `default` sibling and stays an object.
      expect(date?.description).toEqual({
        fr: '{event.startAtDate} au {event.endAtDate}',
        default: '{event.startAtDate} until {event.endAtDate}',
      });
    });

    it('preserves the untranslated default alongside the requested locale', () => {
      const age = findElement(getEventPreset('camp', ['cs']).form, 'i_age');

      expect(age?.title).toEqual({ cs: 'Věk', default: 'Age' });
    });

    it('falls back to the default text for a locale the preset has no translations for', () => {
      const { form } = getEventPreset('camp', ['es']);

      // `default` is the only survivor, so SurveyJS serialises it as a plain
      // string. Dropping it as well would leave the question without any text
      // at all.
      expect(localeKeys(form)).toEqual(new Set());
      expect(findElement(form, 'i_age')?.title).toBe('Age');
    });
  });

  describe('table templates', () => {
    it.each(PRESETS)('keeps only the requested locales (%s)', (preset) => {
      const { tableTemplates } = getEventPreset(preset, ['de', 'pl']);

      expect(localeKeys(tableTemplates)).toEqual(new Set(['de', 'pl']));
    });

    it('filters titles and column labels alike', () => {
      const [template] = getEventPreset('camp', ['de']).tableTemplates;

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
      const [template] = getEventPreset('camp', ['es']).tableTemplates;

      expect(template?.title).toEqual(
        EVENT_PRESETS.camp.tableTemplates[0]?.title,
      );
    });
  });
});

describe('defaultMessageTemplatesForCountries', () => {
  const TRIGGERS = Object.keys(EVENT_PRESETS.general.messageTemplates);

  it.each(PRESETS)('creates every trigger for every country (%s)', (preset) => {
    const templates = defaultMessageTemplatesForCountries(['de', 'fr'], preset);

    expect(templates).toHaveLength(TRIGGERS.length * 2);
    for (const template of templates) {
      expect(template.subject).toEqual(expect.any(String));
      expect(template.body).toEqual(expect.any(String));
    }
  });

  it.each(PRESETS)('uses the templates of the preset (%s)', (preset) => {
    const [template] = defaultMessageTemplatesForCountries(['gb'], preset);
    const { subject, body } =
      EVENT_PRESETS[preset].messageTemplates.registration_submitted;

    expect(template).toEqual({
      trigger: 'registration_submitted',
      country: 'gb',
      subject: subject.en,
      body: body.en,
    });
  });

  it('uses the formal register for seminars', () => {
    const confirmed = defaultMessageTemplatesForCountries(
      ['de'],
      'seminar',
    ).find(({ trigger }) => trigger === 'registration_confirmed');

    expect(confirmed?.body).toContain('Ihre Anmeldung');
  });

  it('defaults to the camp preset', () => {
    expect(defaultMessageTemplatesForCountries(['de'])).toEqual(
      defaultMessageTemplatesForCountries(['de'], 'camp'),
    );
  });
});

describe('defaultSettingsForPreset', () => {
  it('shows every navigation item for camps', () => {
    expect(defaultSettingsForPreset(EVENT_PRESETS.camp)).toEqual([]);
  });

  it.each(['seminar', 'general'] as const)(
    'hides the room and chore planners (%s)',
    (preset) => {
      expect(defaultSettingsForPreset(EVENT_PRESETS[preset])).toEqual([
        {
          key: 'navigation',
          data: { hiddenItems: ['room_planner', 'chore_planner'] },
        },
      ]);
    },
  );

  it('survives locale filtering', () => {
    expect(getEventPreset('seminar', ['de']).settings).toEqual(
      EVENT_PRESETS.seminar.settings,
    );
  });
});
