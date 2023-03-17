import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

export function useObjectTranslation() {
  const { locale, fallbackLocale } = useI18n();

  function to(value: string | Record<string, string>): string {
    if (typeof value !== 'object') {
      return value;
    }

    return computed<string>(() => {
      if (locale.value in value) {
        return value[locale.value];
      }

      const shortLocale = locale.value.split('-')[0];
      if (shortLocale in value) {
        return value[shortLocale];
      }

      const fallback = fallbackLocale.value as string;
      if (fallback in value) {
        return value[fallback];
      }

      const shortFallback = fallback.split('-')[0];
      if (shortFallback in value) {
        return value[shortFallback];
      }

      return Object.values(value)[0];
    }).value;
  }

  return {
    to,
  };
}
