import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAPIService } from '@/services/APIService';
import { useAction } from '@/composables/action';

export const useTranslationStore = defineStore('translation', () => {
  const api = useAPIService();
  const { run } = useAction('translation');

  // `null` means "not checked yet". Checked once, the moment the store is
  // first created (Pinia stores are singletons), so consumers can just read
  // `available` instead of each having to trigger the check themselves.
  const available = ref<boolean | null>(null);
  void api
    .fetchTranslationStatus()
    .then((status) => {
      available.value = status.available;
    })
    .catch(() => {
      available.value = false;
    });

  /** Rejects (already reported) when the translation request fails. */
  function translate(
    text: string,
    targetLocales: string[],
    sourceLocale?: string,
  ): Promise<Record<string, string | null>> {
    return run('autoTranslate', () =>
      api.translateText(text, targetLocales, sourceLocale),
    );
  }

  return {
    available,
    translate,
  };
});
