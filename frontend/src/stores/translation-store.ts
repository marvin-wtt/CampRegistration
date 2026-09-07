import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { ref } from 'vue';

export const useTranslationStore = defineStore('translation', () => {
  const apiService = useAPIService();
  const { withErrorNotification } = useServiceNotifications('translation');

  // `null` means "not checked yet". Checked once, the moment the store is
  // first created (Pinia stores are singletons), so consumers can just read
  // `available` instead of each having to trigger the check themselves.
  const available = ref<boolean | null>(null);
  void apiService
    .fetchTranslationStatus()
    .then((status) => {
      available.value = status.available;
    })
    .catch(() => {
      available.value = false;
    });

  async function translate(
    text: string,
    targetLocales: string[],
    sourceLocale?: string,
  ): Promise<Record<string, string | null> | undefined> {
    return withErrorNotification('autoTranslate', () =>
      apiService.translateText(text, targetLocales, sourceLocale),
    );
  }

  return {
    available,
    translate,
  };
});
