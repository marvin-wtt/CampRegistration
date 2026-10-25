import { describe, expect, it } from 'vitest';
import { APP_LOCALES } from '@camp-registration/common/locales';
import { EVENT_PRESET_NAMES } from '@camp-registration/common/entities';
import { EVENT_PRESETS } from '#app/event/presets/index';

// SurveyJS's fallback text, shown when no locale matches.
const TRANSLATION_KEYS = new Set<string>([...APP_LOCALES, 'default']);

// Too many to annotate one by one, so the presets are checked as a whole: any
// object keyed only by locales is a translation and needs every locale.
function isTranslation(value: object): value is Record<string, unknown> {
  const keys = Object.keys(value);

  return (
    keys.some((key) => key !== 'default') &&
    keys.every((key) => TRANSLATION_KEYS.has(key))
  );
}

function missingTranslations(value: unknown, path: string): string[] {
  if (typeof value !== 'object' || value === null) {
    return [];
  }

  if (!Array.isArray(value) && isTranslation(value)) {
    return APP_LOCALES.filter((locale) => !value[locale]).map(
      (locale) => `${path}: ${locale}`,
    );
  }

  return Object.entries(value).flatMap(([key, child]) =>
    missingTranslations(child, `${path}.${key}`),
  );
}

describe('event preset translations', () => {
  it.each(EVENT_PRESET_NAMES)('%s is translated into every locale', (name) => {
    expect(missingTranslations(EVENT_PRESETS[name], name)).toEqual([]);
  });

  it('reports a missing locale', () => {
    const preset = { form: { title: { en: 'Title', de: 'Titel' } } };

    expect(missingTranslations(preset, 'preset')).toEqual(
      APP_LOCALES.filter((locale) => !['en', 'de'].includes(locale)).map(
        (locale) => `preset.form.title: ${locale}`,
      ),
    );
  });
});
