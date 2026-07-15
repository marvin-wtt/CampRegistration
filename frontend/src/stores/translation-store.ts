import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { ref } from 'vue';

export const useTranslationStore = defineStore('translation', () => {
  const apiService = useAPIService();
  const { withErrorNotification } = useServiceNotifications('translation');

  // `null` means "not checked yet"; the check is cached for the app's
  // lifetime and shared by every TranslatedInput instance.
  const available = ref<boolean | null>(null);
  let pendingCheck: Promise<void> | undefined;

  async function checkAvailability(): Promise<boolean> {
    if (available.value !== null) {
      return available.value;
    }

    pendingCheck ??= apiService
      .fetchTranslationStatus()
      .then((status) => {
        available.value = status.available;
      })
      .catch(() => {
        available.value = false;
      })
      .finally(() => {
        pendingCheck = undefined;
      });

    await pendingCheck;

    return available.value ?? false;
  }

  async function translate(
    text: string,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string | undefined> {
    return withErrorNotification('autoTranslate', () =>
      apiService.translateText(text, targetLocale, sourceLocale),
    );
  }

  return {
    available,
    checkAvailability,
    translate,
  };
});
