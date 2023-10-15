import { QNotifyCreateOptions, useQuasar } from 'quasar';
import { QNotifyUpdateOptions } from 'quasar/dist/types/api';
import { hasMessage } from 'src/composables/errorChecker';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { isAPIServiceError } from 'src/services/APIService';

export interface ProgressOptions {
  progress?: QNotifyCreateOptions;
  success?: QNotifyUpdateOptions;
  error?: QNotifyUpdateOptions;
}

export interface ResultOptions {
  success?: QNotifyCreateOptions;
  error?: QNotifyCreateOptions;
}

export function useServiceHandler<T>(storeName: string) {
  const quasar = useQuasar();
  const { t } = useI18n();

  const data = ref<T>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const needsUpdate = ref<boolean>(true);
  const pendingRequests = ref<number>(0);

  const requestPending = computed<boolean>(() => {
    return pendingRequests.value > 0;
  });

  function defaultProgressOptions(
    operation: string,
    options?: ProgressOptions,
  ): Required<ProgressOptions> {
    // Set defaults
    options = options ?? {};

    //
    const progressOptions = options.progress ?? {};
    progressOptions.group = false;
    progressOptions.position = progressOptions.position ?? 'top';
    progressOptions.timeout = 0;
    progressOptions.spinner = true;
    progressOptions.message =
      progressOptions.message ?? t(`stores.${storeName}.${operation}.progress`);

    //
    const successOptions = defaultSuccessOptions(operation, options.success);
    successOptions.spinner = false;
    successOptions.timeout = successOptions.timeout ?? 2500;

    //
    const errorOptions = defaultErrorOptions(operation, options.error);
    errorOptions.spinner = false;
    errorOptions.timeout = errorOptions.timeout ?? 2500;

    return {
      progress: progressOptions,
      success: successOptions,
      error: errorOptions,
    };
  }

  function defaultResultOptions(
    operation: string,
    options?: ResultOptions,
  ): Required<ResultOptions> {
    // Set defaults
    const successOptions = defaultSuccessOptions(operation, options?.success);
    const errorOptions = defaultErrorOptions(operation, options?.error);

    return {
      success: successOptions,
      error: errorOptions,
    };
  }

  function defaultSuccessOptions(
    operation: string,
    options?: QNotifyCreateOptions,
  ): QNotifyCreateOptions {
    //
    const successOptions = options ?? {};
    successOptions.type = successOptions.type ?? 'positive';
    successOptions.position = successOptions.position ?? 'top';
    successOptions.message =
      successOptions?.message ?? t(`stores.${storeName}.${operation}.success`);

    return successOptions;
  }

  function defaultErrorOptions(
    operation: string,
    options?: QNotifyCreateOptions,
  ): QNotifyCreateOptions {
    //
    const errorOptions = options ?? {};
    errorOptions.type = errorOptions.type ?? 'negative';
    errorOptions.position = errorOptions.position ?? 'top';
    errorOptions.message =
      errorOptions?.message ?? t(`stores.${storeName}.${operation}.error`);

    return errorOptions;
  }

  async function withProgressNotification<T>(
    operation: string,
    fn: (notify: (props?: QNotifyUpdateOptions) => void) => Promise<T>,
    options?: ProgressOptions,
  ): Promise<boolean> {
    // Set defaults
    const opt = defaultProgressOptions(operation, options);

    // Show progress indicator
    const notify = quasar.notify(opt.progress);

    try {
      await fn(notify);

      notify(opt.success);

      return true;
    } catch (error: unknown) {
      opt.error.caption = extractErrorText(error);
      notify(opt.error);
      return false;
    }
  }

  function withMultiProgressNotification<T>(
    promises: Promise<T>[],
    operation: string,
    options?: ProgressOptions,
  ): Promise<boolean> {
    return withProgressNotification(
      operation,
      async (notify) => {
        let doneCounter = 0;
        for (const promise of promises) {
          promise.then(() => {
            doneCounter++;
            const percentage = Math.floor(
              (doneCounter / promises.length) * 100,
            );

            notify({
              caption: `${percentage} %`,
            });
          });
        }

        await Promise.all(promises);
      },
      options,
    );
  }

  async function withResultNotification<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: ResultOptions,
  ): Promise<boolean> {
    const opt = defaultResultOptions(operation, options);

    // Set defaults
    try {
      await fn();

      quasar.notify(opt.success);

      return true;
    } catch (error: unknown) {
      opt.error.caption = extractErrorText(error);
      quasar.notify(opt.error);

      return false;
    }
  }

  async function withErrorNotification<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: QNotifyCreateOptions,
  ): Promise<boolean> {
    const opt = defaultErrorOptions(operation, options);

    // Set defaults
    try {
      await fn();

      return true;
    } catch (error: unknown) {
      opt.caption = extractErrorText(error);
      quasar.notify(opt);

      return false;
    }
  }

  function showErrorNotification(
    operation: string,
    options?: QNotifyCreateOptions,
  ) {
    const opt = defaultErrorOptions(operation, options);
    quasar.notify(opt);
  }

  function showSuccessNotification(
    operation: string,
    options?: QNotifyCreateOptions,
  ) {
    const opt = defaultSuccessOptions(operation, options);
    quasar.notify(opt);
  }

  async function forceFetch(
    fn: () => Promise<T> | Promise<undefined>,
  ): Promise<void> {
    await errorOnFailure(fn);
    needsUpdate.value = false;
  }

  function asyncUpdate(fn: () => Promise<unknown>) {
    pendingRequests.value++;
    fn().finally(() => pendingRequests.value--);
  }

  async function errorOnFailure(
    fn: () => Promise<T> | Promise<undefined>,
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;
    data.value = undefined;
    try {
      data.value = await fn();
      needsUpdate.value = false;
    } catch (err: unknown) {
      error.value = extractErrorText(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function lazyFetch(
    fn: () => Promise<T> | Promise<undefined>,
  ): Promise<void> {
    if (!needsUpdate.value) {
      return;
    }

    await forceFetch(fn);
  }

  function checkNotNullWithError(
    param: string | undefined | null,
  ): string | never {
    if (param && param.length > 0) {
      return param;
    }
    quasar.notify(
      defaultErrorOptions('', {
        message: 'Internal error',
        caption: 'Invalid parameter(s).',
      }),
    );

    throw new Error(`Invalid parameter(s) at ${storeName} store.`);
  }

  function checkNotNullWithNotification(
    param: string | undefined | null,
  ): string | never {
    if (param && param.length > 0) {
      return param;
    }
    error.value = 'Invalid parameter(s).';

    throw new Error(`Invalid parameter(s) at ${storeName} store.`);
  }

  function extractErrorText(err: unknown): string {
    if (!isAPIServiceError(err)) {
      // TODO Translate
      return hasMessage(err)
        ? err.message
        : 'Service temporary unavailable. Please try again later.';
    }

    if (err.response) {
      return err.response.data.message ?? err.response.statusText;
    }

    return 'Server temporary not available.';
  }

  function invalidate() {
    needsUpdate.value = true;
  }

  function reset() {
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
  }

  function handlerByType(
    type: 'progress' | 'result' | 'error' | 'none',
  ): (operation: string, fn: () => Promise<void>) => Promise<boolean> {
    switch (type) {
      case 'progress':
        return withProgressNotification;
      case 'result':
        return withResultNotification;
      case 'error':
        return withErrorNotification;
      case 'none':
        return async (operation: string, fn: () => Promise<void>) => {
          try {
            await fn();

            return true;
          } catch (ignored: unknown) {
            return false;
          }
        };
    }
  }

  return {
    data,
    isLoading,
    error,
    requestPending,
    reset,
    invalidate,
    errorOnFailure,
    forceFetch,
    lazyFetch,
    asyncUpdate,
    handlerByType,
    withProgressNotification,
    withMultiProgressNotification,
    withResultNotification,
    withErrorNotification,
    showErrorNotification,
    showSuccessNotification,
    checkNotNullWithError,
    checkNotNullWithNotification,
  };
}
