import { useI18n } from 'vue-i18n';
import { COUNTRY_LOCALES } from '@/i18n/locales';

function candidateKeys(locale: string): string[] {
  const normalizedLocale = locale.toLowerCase();
  const [language, region] = normalizedLocale.split('-');

  if (!language) {
    return [];
  }

  const sameLanguageCountries = Object.keys(COUNTRY_LOCALES).filter(
    (country) => COUNTRY_LOCALES[country] === language,
  );

  return [
    ...new Set([
      normalizedLocale,
      language,

      // The lookup key can itself be a country code (`cz` -> `cs`).
      ...(COUNTRY_LOCALES[language] ? [COUNTRY_LOCALES[language]] : []),

      // Prefer the reader's own country over other countries using the
      // same language.
      ...(region ? [region] : []),

      ...sameLanguageCountries,
    ]),
  ];
}

function pickTranslation(
  value: Record<string, string>,
  locale: string,
  fallbackLocale: string,
): string {
  const tryLocale = (candidate: string) =>
    candidateKeys(candidate)
      .map((key) => value[key])
      .find((translation) => translation != null && translation !== '');

  return (
    tryLocale(locale) ??
    tryLocale(fallbackLocale) ??
    Object.values(value).find(Boolean) ??
    ''
  );
}

export function useObjectTranslation() {
  const { locale, fallbackLocale } = useI18n({
    useScope: 'global',
  });

  function to(
    value: string | Record<string, string> | undefined | null,
  ): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    const fallback =
      typeof fallbackLocale.value === 'string' ? fallbackLocale.value : 'en';

    return pickTranslation(value, locale.value, fallback);
  }

  function toAll(
    value: string | Record<string, string> | undefined | null,
  ): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    return [...new Set(Object.values(value).filter(Boolean))].join(' / ');
  }

  return {
    to,
    toAll,
  };
}
