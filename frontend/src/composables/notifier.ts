import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useErrorExtractor } from '@/composables/errorText';

export interface ProgressToast {
  update: (caption: string) => void;
  succeed: () => void;
  fail: (err: unknown, message?: string) => void;
}

export interface Notifier {
  error: (operation: string, err?: unknown, message?: string) => void;
  success: (operation: string) => void;
  progress: (operation: string) => ProgressToast;
}

const RESULT_TIMEOUT = 2500;

/**
 * Toasts for an operation, worded by `<prefix>.<operation>.progress|success|
 * error`. A store passes its name (`stores.<name>` in the global messages); a
 * component passes nothing and words them in its own `request:` block.
 * Only presentation — what a failure means is up to the caller.
 */
export function useNotifier(storeName?: string): Notifier {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: storeName ? 'global' : 'local' });
  const { extractErrorText } = useErrorExtractor();
  const prefix = storeName ? `stores.${storeName}` : 'request';

  const text = (operation: string, kind: string) =>
    t(`${prefix}.${operation}.${kind}`);

  // Without `err` the toast has no caption (e.g. a retry that gave up).
  function error(operation: string, err?: unknown, message?: string) {
    quasar.notify({
      type: 'negative',
      position: 'top',
      message: message ?? text(operation, 'error'),
      ...(err === undefined ? {} : { caption: extractErrorText(err) }),
    });
  }

  function success(operation: string) {
    quasar.notify({
      type: 'positive',
      position: 'top',
      message: text(operation, 'success'),
    });
  }

  function progress(operation: string): ProgressToast {
    const update = quasar.notify({
      group: false,
      position: 'top',
      color: 'inverse-surface',
      textColor: 'inverse-on-surface',
      timeout: 0,
      spinner: true,
      message: text(operation, 'progress'),
    });

    return {
      update: (caption) => update({ caption }),
      succeed: () =>
        update({
          type: 'positive',
          color: 'positive',
          textColor: 'on-positive',
          spinner: false,
          timeout: RESULT_TIMEOUT,
          message: text(operation, 'success'),
          caption: '',
        }),
      fail: (err, message) =>
        update({
          type: 'negative',
          color: 'negative',
          textColor: 'on-error',
          spinner: false,
          timeout: RESULT_TIMEOUT,
          message: message ?? text(operation, 'error'),
          caption: extractErrorText(err),
        }),
    };
  }

  return { error, success, progress };
}
