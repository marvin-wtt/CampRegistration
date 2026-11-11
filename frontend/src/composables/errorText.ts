import { useI18n } from 'vue-i18n';
import { hasMessage } from '@/composables/errorChecker';
import { isAPIServiceError } from '@/services/APIService';

// Turns any thrown value into text for the user: the API's own message where
// there is one, otherwise a generic one.
export function useErrorExtractor() {
  const { t } = useI18n({ useScope: 'global' });

  function extractErrorText(err: unknown): string {
    if (!isAPIServiceError(err)) {
      return hasMessage(err) ? err.message : t('service.unavailable');
    }

    if (!err.response) {
      return t('service.unknown');
    }

    // The body may be empty or not JSON (e.g. a proxy's error page).
    const message: unknown = (
      err.response.data as { message?: unknown } | null | undefined
    )?.message;
    return typeof message === 'string' && message.length > 0
      ? message
      : err.response.statusText || t('service.unknown');
  }

  return { extractErrorText };
}
