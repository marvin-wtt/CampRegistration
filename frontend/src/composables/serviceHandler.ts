import { QNotifyCreateOptions, useQuasar } from 'quasar';
import { QNotifyUpdateOptions } from 'quasar';
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

export function useServiceHandler<T>(storeName?: string) {
  const { t } = useI18n();

  const serviceNotifications = useServiceNotifications(storeName);
  const { extractErrorText } = useErrorExtractor();

  const data = ref<T>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const needsUpdate = ref<boolean>(true);
  const pendingRequests = ref<number>(0);

  const requestPending = computed<boolean>(() => {
    return pendingRequests.value > 0;
  });

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
    error.value = t('service.invalidParams');

    throw new Error('Invalid parameter(s)');
  }

  function invalidate() {
    needsUpdate.value = true;
  }

  function reset() {
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
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
    checkNotNullWithError,
    ...serviceNotifications,
  };
}

function useErrorExtractor() {
  const { t } = useI18n();

  function extractErrorText(err: unknown): string {
    if (!isAPIServiceError(err)) {
      return hasMessage(err) ? err.message : t('service.unavailable');
    }

    if (err.response) {
      return err.response.data.message ?? err.response.statusText;
    }

    return t('service.unknown');
  }

  return {
    extractErrorText,
  };
}

function useServiceNotifications(storeName?: string) {
  const { t } = useI18n();
  const quasar = useQuasar();
  const { extractErrorText } = useErrorExtractor();

  const translationPrefix = storeName ? `stores.${storeName}` : 'request';

  function handlerByType<T>(
    type: 'progress' | 'result' | 'error' | 'none',
  ): (operation: string, fn: () => Promise<T>) => Promise<T | undefined> {
    switch (type) {
      case 'progress':
        return withProgressNotification;
      case 'result':
        return withResultNotification;
      case 'error':
        return withErrorNotification;
      case 'none':
        return async (_: string, fn: () => Promise<T>) => {
          try {
            return await fn();
          } catch (ignored: unknown) {
            return undefined;
          }
        };
    }
  }

  async function withErrorNotification<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: QNotifyCreateOptions,
  ): Promise<T | undefined> {
    const opt = defaultErrorOptions(operation, options);

    // Set defaults
    try {
      return await fn();
    } catch (error: unknown) {
      opt.caption = extractErrorText(error);
      quasar.notify(opt);
    }

    return undefined;
  }

  async function withProgressNotification<T>(
    operation: string,
    fn: (notify: (props?: QNotifyUpdateOptions) => void) => Promise<T>,
    options?: ProgressOptions,
  ): Promise<T> {
    // Set defaults
    const opt = defaultProgressOptions(operation, options);

    // Show progress indicator
    const notify = quasar.notify(opt.progress);

    try {
      const result = await fn(notify);

      notify(opt.success);

      return result;
    } catch (error: unknown) {
      opt.error.caption = extractErrorText(error);
      notify(opt.error);

      throw error;
    }
  }

  function withMultiProgressNotification<T>(
    promises: Promise<T>[],
    operation: string,
    options?: ProgressOptions,
  ): Promise<T[]> {
    const func = async (
      notify: (props?: QNotifyUpdateOptions) => void,
    ): Promise<T[]> => {
      let doneCounter = 0;
      for (const promise of promises) {
        promise.then(() => {
          doneCounter++;
          const percentage = Math.floor((doneCounter / promises.length) * 100);

          notify({
            caption: `${percentage} %`,
          });
        });
      }

      return Promise.all(promises);
    };

    return withProgressNotification(operation, func, options);
  }

  async function withResultNotification<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: ResultOptions,
  ): Promise<T> {
    const opt = defaultResultOptions(operation, options);

    // Set defaults
    try {
      const result = await fn();

      quasar.notify(opt.success);

      return result;
    } catch (error: unknown) {
      opt.error.caption = extractErrorText(error);
      quasar.notify(opt.error);

      throw error;
    }
  }

  function checkNotNullWithNotification(
    param: string | undefined | null,
  ): string | never {
    if (param && param.length > 0) {
      return param;
    }
    quasar.notify(
      defaultErrorOptions('', {
        message: t('service.internal'),
        caption: t('service.invalidParams'),
      }),
    );

    throw new Error('Invalid parameter(s).');
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
      progressOptions.message ??
      t(`${translationPrefix}.${operation}.progress`);

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
      successOptions?.message ?? t(`${translationPrefix}.${operation}.success`);

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
      errorOptions?.message ?? t(`${translationPrefix}.${operation}.error`);

    return errorOptions;
  }

  return {
    handlerByType,
    withProgressNotification,
    withMultiProgressNotification,
    withResultNotification,
    withErrorNotification,
    showErrorNotification,
    showSuccessNotification,
    checkNotNullWithNotification,
  };
}
