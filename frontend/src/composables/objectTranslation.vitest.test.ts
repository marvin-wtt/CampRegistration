import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useObjectTranslation } from '@/composables/objectTranslation';

const locale = ref('en-US');
const fallbackLocale = ref('en-US');

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale, fallbackLocale }),
}));

function to(
  value: string | Record<string, string> | null | undefined,
  readerLocale = 'en-US',
): string {
  locale.value = readerLocale;

  return useObjectTranslation().to(value);
}

describe('useObjectTranslation', () => {
  it('passes plain values through', () => {
    expect(to('Summer Camp')).toBe('Summer Camp');
    expect(to(null)).toBe('');
    expect(to(undefined)).toBe('');
    expect(to({})).toBe('');
  });

  describe('language-keyed values', () => {
    const name = { en: 'Summer Camp', de: 'Sommerlager' };

    it('resolves the reader language from a locale tag', () => {
      expect(to(name, 'en-US')).toBe('Summer Camp');
      expect(to(name, 'de-DE')).toBe('Sommerlager');
    });

    it('falls back to the fallback locale for an unwritten language', () => {
      expect(to(name, 'fr-FR')).toBe('Summer Camp');
    });
  });

  describe('country-keyed values', () => {
    // An event's own fields are keyed by `event.countries`, not by language.
    it('resolves a country whose language the reader speaks', () => {
      const name = { gb: 'Summer Camp', de: 'Sommerlager' };

      expect(to(name, 'en-US')).toBe('Summer Camp');
      expect(to(name, 'de-DE')).toBe('Sommerlager');
    });

    it('does not depend on the order the countries were written in', () => {
      const name = { de: 'Sommerlager', gb: 'Summer Camp' };

      expect(to(name, 'en-US')).toBe('Summer Camp');
      expect(to(name, 'de-DE')).toBe('Sommerlager');
    });

    it('prefers the reader own country over others speaking its language', () => {
      const name = { gb: 'Summer Camp', us: 'Summer Kamp' };

      expect(to(name, 'en-US')).toBe('Summer Kamp');
      expect(to(name, 'en-GB')).toBe('Summer Camp');
    });

    it('maps a country code to the language it speaks', () => {
      expect(to({ cs: 'Letni tabor', de: 'Sommerlager' }, 'cz')).toBe(
        'Letni tabor',
      );
    });

    it('falls back to the fallback locale, then to any value', () => {
      expect(to({ gb: 'Summer Camp', de: 'Sommerlager' }, 'fr-FR')).toBe(
        'Summer Camp',
      );
      expect(to({ cz: 'Letni tabor' }, 'fr-FR')).toBe('Letni tabor');
    });
  });

  it('joins every distinct value for toAll', () => {
    const { toAll } = useObjectTranslation();

    expect(toAll({ de: 'Sommerlager', gb: 'Summer Camp' })).toBe(
      'Sommerlager / Summer Camp',
    );
    expect(toAll({ de: 'Camp', gb: 'Camp' })).toBe('Camp');
  });
});
