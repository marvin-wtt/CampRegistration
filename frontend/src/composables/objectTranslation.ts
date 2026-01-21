import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const countryLangMap: Record<string, string> = {
  cz: 'cs',
} as const;

function normalizeLocale(loc: string): string {
  if (loc.length === 5 && loc.charAt(2) === '-') {
    return loc.slice(0, 2);
  }

  return countryLangMap[loc] ?? loc;
}

function pickTranslation(
  value: Record<string, string>,
  locale: string,
  fallbackLocale: string,
): string {
  const tryLoc = (loc: string) => value[loc] ?? value[normalizeLocale(loc)];

  return (
    tryLoc(locale) ?? tryLoc(fallbackLocale) ?? Object.values(value)[0] ?? ''
  );
}

export function useObjectTranslation() {
  const { locale, fallbackLocale } = useI18n({
    useScope: 'global',
  });

  function to(value: string | Record<string, string> | undefined): string {
    if (value === undefined || value == null) {
      return '';
    }

    if (typeof value !== 'object') {
      return value;
    }

    return computed<string>(() => {
      const fallback =
        typeof fallbackLocale.value === 'string' ? fallbackLocale.value : 'en';

      return pickTranslation(value, locale.value, fallback);
    }).value;
  }

  return {
    to,
  };
}
