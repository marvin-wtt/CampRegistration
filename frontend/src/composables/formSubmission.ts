import { readonly, ref } from 'vue';
import { useErrorExtractor } from '@/composables/errorText';

/**
 * A form's submit, whose failure the form shows inline rather than as a
 * toast. The follow-up (e.g. navigating on) belongs inside `fn`, so it only
 * runs when the submit succeeded.
 */
export function useFormSubmission() {
  const { extractErrorText } = useErrorExtractor();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function submit(fn: () => Promise<void>): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      await fn();
    } catch (err: unknown) {
      error.value = extractErrorText(err);
    } finally {
      isLoading.value = false;
    }
  }

  function reset() {
    isLoading.value = false;
    error.value = null;
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    submit,
    reset,
  };
}
