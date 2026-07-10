import {
  type QNotifyCreateOptions,
  type QNotifyUpdateOptions,
  useQuasar,
} from 'quasar';
import { hasMessage } from '@/composables/errorChecker';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { isAPIServiceError } from '@/services/APIService';
import { useRoute } from 'vue-router';

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
  const { t } = useI18n({
    useScope: 'global',
  });
  const route = useRoute();

  const serviceNotifications = useServiceNotifications(storeName);
  const { extractErrorText } = useErrorExtractor();

  const data = ref<T>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const needsUpdate = ref<boolean>(true);
  const pendingRequests = ref<number>(0);
  // Bumped on every fetch; lets a resolving promise detect it's been
  // superseded by a newer fetch (e.g. the user switched camps again before
  // the previous request settled) and skip applying its now-stale result.
  let requestToken = 0;

  const requestPending = computed<boolean>(() => {
    return pendingRequests.value > 0;
  });

  async function forceFetch(
    fn: () => Promise<T> | Promise<undefined>,
  ): Promise<void> {
    const token = ++requestToken;
    await errorOnFailure(fn, token);
    if (token === requestToken) {
      needsUpdate.value = false;
    }
  }

  async function asyncUpdate(fn: () => Promise<unknown>) {
    pendingRequests.value++;
    await fn().finally(() => pendingRequests.value--);
  }

  async function errorOnFailure(
    fn: () => Promise<T> | Promise<undefined>,
    token: number = ++requestToken,
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;
    data.value = undefined;
    try {
      const result = await fn();
      if (token !== requestToken) {
        return;
      }
      data.value = result;
      needsUpdate.value = false;
    } catch (err: unknown) {
      if (token !== requestToken) {
        return;
      }
      error.value = extractErrorText(err);
    } finally {
      if (token === requestToken) {
        isLoading.value = false;
      }
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

  async function backgroundFetch(
    fn: () => Promise<T> | Promise<undefined>,
  ): Promise<void> {
    const token = ++requestToken;
    await asyncUpdate(async () => {
      try {
        const result = await fn();
        if (token !== requestToken) {
          return;
        }
        data.value = result;
        error.value = null;
        needsUpdate.value = false;
      } catch {
        if (token !== requestToken) {
          return;
        }
        needsUpdate.value = true;
      }
    });
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
    requestToken++;
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
    needsUpdate.value = true;
  }

  function queryParam(modelName: string): string | never {
    let id = route.params[modelName];

    if (Array.isArray(id)) {
      id = id[0];
    }

    return checkNotNullWithError(id);
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
    backgroundFetch,
    asyncUpdate,
    checkNotNullWithError,
    queryParam,
    ...serviceNotifications,
  };
}

export function useErrorExtractor() {
  const { t } = useI18n({
    useScope: 'global',
  });

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

export function useServiceNotifications(storeName?: string) {
  const { t } = useI18n({
    useScope: storeName ? 'global' : 'local',
  });
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  async function withMultiProgressNotification<T>(
    promises: Promise<T>[],
    operation: string,
    options?: ProgressOptions,
  ): Promise<T[]> {
    const func = async (
      notify: (props?: QNotifyUpdateOptions) => void,
    ): Promise<T[]> => {
      const total = promises.length;

      if (total === 0) {
        notify({ caption: '100 %' });
        return [];
      }

      let done = 0;

      const wrappedPromises = promises.map((p) =>
        p.finally(() => {
          done++;
          const percentage = Math.floor((done / total) * 100);

          notify({
            caption: `${percentage} %`,
          });
        }),
      );

      return Promise.all(wrappedPromises);
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
    progressOptions.color = progressOptions.color ?? 'inverse-surface';
    progressOptions.textColor =
      progressOptions.textColor ?? 'inverse-on-surface';
    progressOptions.timeout = 0;
    progressOptions.spinner = true;
    progressOptions.message =
      progressOptions.message ??
      t(`${translationPrefix}.${operation}.progress`);

    //
    const successOptions = defaultSuccessOptions(operation, options.success);
    successOptions.spinner = false;
    successOptions.type = 'positive';
    successOptions.color = successOptions.color ?? 'positive';
    successOptions.textColor = successOptions.textColor ?? 'white';
    successOptions.timeout = successOptions.timeout ?? 2500;

    //
    const errorOptions = defaultErrorOptions(operation, options.error);
    errorOptions.spinner = false;
    errorOptions.type = 'negative';
    errorOptions.color = errorOptions.color ?? 'negative';
    errorOptions.textColor = errorOptions.textColor ?? 'white';
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
