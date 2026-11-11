import { useNotifier } from '@/composables/notifier';
import { asReportedError } from '@/utils/reportedError';

/**
 * Which toasts an action shows. A failure is always reported:
 * - `error`: only the failure — for results that show in place;
 * - `result`: the outcome, success or failure;
 * - `progress`: a running toast that turns into the outcome — for slow or
 *   bulk actions.
 */
export type Feedback = 'error' | 'result' | 'progress';

export interface ActionOptions {
  feedback?: Feedback;
  /** Replaces the operation's default error message. */
  errorMessage?: string;
}

/** Reports how far a long action has got, shown as the toast's caption. */
export type ReportProgress = (caption: string) => void;

export function useAction(storeName?: string) {
  const notifier = useNotifier(storeName);

  /**
   * Runs a user action. On failure it shows the error and rejects with it
   * marked as reported, so a caller's follow-up is skipped without anything
   * reporting it a second time.
   */
  async function run<R>(
    operation: string,
    fn: (report: ReportProgress) => Promise<R>,
    { feedback = 'error', errorMessage }: ActionOptions = {},
  ): Promise<R> {
    const toast = feedback === 'progress' ? notifier.progress(operation) : null;
    try {
      const result = await fn((caption) => toast?.update(caption));
      if (toast) {
        toast.succeed();
      } else if (feedback === 'result') {
        notifier.success(operation);
      }
      return result;
    } catch (err: unknown) {
      if (toast) {
        toast.fail(err, errorMessage);
      } else {
        notifier.error(operation, err, errorMessage);
      }
      throw asReportedError(err);
    }
  }

  return { run };
}

/**
 * Runs requests in parallel and reports their completion in percent. Rejects
 * once all have settled if any failed, so no request is left running unseen.
 */
export async function settleAll<T>(
  requests: (() => Promise<T>)[],
  report: ReportProgress,
): Promise<T[]> {
  let done = 0;
  report('0 %');
  const results = await Promise.allSettled(
    requests.map((request) =>
      request().finally(() => {
        done++;
        report(`${Math.floor((done / requests.length) * 100)} %`);
      }),
    ),
  );

  const failed = results.find((result) => result.status === 'rejected');
  if (failed) {
    throw failed.reason;
  }
  return results.map((result) => (result as PromiseFulfilledResult<T>).value);
}
