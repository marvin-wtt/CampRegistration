import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const countryLangMap: Record<string, string> = {
  cz: 'cs',
};

function normalizeLocale(locale: string): string {
  if (locale.length === 5 && locale.charAt(2) === '-') {
    return locale.slice(0, 2);
  }

  return countryLangMap[locale] ?? locale;
}

function pickTranslation(
  value: Record<string, string>,
  locale: string,
  fallbackLocale: string,
): string {
  const tryLocale = (locale: string) =>
    value[locale] ?? value[normalizeLocale(locale)];

  return (
    tryLocale(locale) ??
    tryLocale(fallbackLocale) ??
    Object.values(value)[0] ??
    ''
  );
}

export function useObjectTranslation() {
  const { locale, fallbackLocale } = useI18n({
    useScope: 'global',
  });

  function to(value: string | Record<string, string> | undefined): string {
    if (value == null) {
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
