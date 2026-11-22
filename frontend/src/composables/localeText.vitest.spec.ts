import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { Translatable } from '@camp-registration/common/entities';
import { localeText, useLocaleTextModel, withLocaleText } from './localeText';

describe('localeText', () => {
  it('reads one locale', () => {
    expect(localeText({ en: 'Hi', de: 'Hallo' }, 'de')).toBe('Hallo');
  });

  it('reads a plain string for every locale', () => {
    expect(localeText('Hi', 'de')).toBe('Hi');
  });

  it('reads nothing as empty', () => {
    expect(localeText(null, 'en')).toBe('');
    expect(localeText(undefined, 'en')).toBe('');
    expect(localeText({ en: 'Hi' }, 'de')).toBe('');
  });
});

describe('withLocaleText', () => {
  it('sets one locale and keeps the others', () => {
    expect(withLocaleText({ en: 'Hi' }, 'de', 'Hallo')).toEqual({
      en: 'Hi',
      de: 'Hallo',
    });
  });

  it('removes a locale set to empty', () => {
    expect(withLocaleText({ en: 'Hi', de: 'Hallo' }, 'de', '')).toEqual({
      en: 'Hi',
    });
  });

  it('is null once no locale has text', () => {
    expect(withLocaleText({ en: 'Hi' }, 'en', '')).toBeNull();
    expect(withLocaleText(null, 'en', '')).toBeNull();
  });

  it('turns a plain string into per-locale text', () => {
    expect(withLocaleText('Hi', 'de', 'Hallo')).toEqual({ de: 'Hallo' });
  });
});

describe('useLocaleTextModel', () => {
  it('edits the field one locale at a time', () => {
    const field = ref<Translatable | null>({ en: 'Hi' });
    const locale = ref('de');
    const model = useLocaleTextModel(
      {
        get: () => field.value,
        set: (value) => (field.value = value),
      },
      locale,
    );

    model.value = 'Hallo';
    locale.value = 'en';

    expect(model.value).toBe('Hi');
    expect(field.value).toEqual({ en: 'Hi', de: 'Hallo' });
  });
});
