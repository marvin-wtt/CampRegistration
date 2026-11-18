import { useI18n } from 'vue-i18n';
import { translate } from '@camp-registration/common/utils';

export function useObjectTranslation() {
  const { locale, fallbackLocale } = useI18n({
    useScope: 'global',
  });

  function to(
    value: string | Record<string, string> | undefined | null,
  ): string {
    if (value == null || typeof value === 'string') {
      return value ?? '';
    }

    const fallback =
      typeof fallbackLocale.value === 'string' ? fallbackLocale.value : 'en';

    return translate(value, locale.value, fallback) ?? '';
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
