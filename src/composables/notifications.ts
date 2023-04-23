import { QNotifyCreateOptions, useQuasar } from 'quasar';
import { QNotifyUpdateOptions } from 'quasar/dist/types/api';
import { hasMessage } from 'src/composables/errorChecker';

export interface ProgressOptions {
  progress?: QNotifyCreateOptions;
  success?: QNotifyUpdateOptions;
  error?: QNotifyUpdateOptions;
}

export interface ResultOptions {
  success?: QNotifyCreateOptions;
  error?: QNotifyCreateOptions;
}

export function useNotification() {
  const quasar = useQuasar();

  function defaultProgressOptions(
    options?: ProgressOptions
  ): Required<ProgressOptions> {
    // Set defaults
    options = options ?? {};

    //
    const progressOptions = options.progress ?? {};
    progressOptions.group = false;
    progressOptions.position = progressOptions.position ?? 'top';
    progressOptions.timeout = 0;
    progressOptions.spinner = true;
    progressOptions.message = progressOptions.message ?? 'Success';

    //
    const successOptions = defaultSuccessOptions(options.success);
    successOptions.spinner = false;
    successOptions.timeout = successOptions.timeout ?? 2500;

    //
    const errorOptions = defaultErrorOptions(options.error);
    errorOptions.spinner = false;
    errorOptions.timeout = errorOptions.timeout ?? 2500;

    return {
      progress: progressOptions,
      success: successOptions,
      error: errorOptions,
    };
  }

  function defaultResultOptions(
    options?: ResultOptions
  ): Required<ResultOptions> {
    // Set defaults
    const successOptions = options?.success ?? {};
    successOptions.type = successOptions.type ?? 'positive';
    successOptions.position = successOptions.position ?? 'top';

    //
    const errorOptions = options?.error ?? {};
    errorOptions.type = errorOptions.type ?? 'negative';
    errorOptions.position = errorOptions.position ?? 'top';

    return {
      success: successOptions,
      error: errorOptions,
    };
  }

  function defaultSuccessOptions(
    options?: QNotifyCreateOptions
  ): QNotifyCreateOptions {
    //
    const errorOptions = options ?? {};
    errorOptions.type = errorOptions.type ?? 'positive';
    errorOptions.position = errorOptions.position ?? 'top';

    return errorOptions;
  }

  function defaultErrorOptions(
    options?: QNotifyCreateOptions
  ): QNotifyCreateOptions {
    //
    const errorOptions = options ?? {};
    errorOptions.type = errorOptions.type ?? 'negative';
    errorOptions.position = errorOptions.position ?? 'top';

    return errorOptions;
  }

  async function withProgressNotification<T>(
    fn: (notify: (props?: QNotifyUpdateOptions) => void) => Promise<T>,
    options?: ProgressOptions
  ): Promise<boolean> {
    // Set defaults
    const opt = defaultProgressOptions(options);

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
    options?: ProgressOptions
  ): Promise<boolean> {
    return withProgressNotification(async (notify) => {
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

      await Promise.all(promises);
    }, options);
  }

  async function withResultNotification<T>(
    fn: () => Promise<T>,
    options?: ResultOptions
  ): Promise<boolean> {
    const opt = defaultResultOptions(options);

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
    fn: () => Promise<T>,
    options?: QNotifyCreateOptions
  ): Promise<boolean> {
    const opt = defaultErrorOptions(options);

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

  function extractErrorText(error: unknown): string | undefined {
    return hasMessage(error) ? error.message : undefined;
  }

  return {
    withProgressNotification,
    withMultiProgressNotification,
    withResultNotification,
    withErrorNotification,
  };
}
