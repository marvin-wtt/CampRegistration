import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { settleAll, useAction } from '@/composables/action';
import { useErrorExtractor } from '@/composables/errorText';
import { isReportedError } from '@/utils/reportedError';

const notify = vi.fn();
const toast = vi.fn();

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify }),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const offline = () => Promise.reject(new Error('offline'));

function httpError(status: number, data: unknown, statusText = ''): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    status,
    statusText,
    data,
    headers: {},
    config,
  });
}

beforeEach(() => {
  notify.mockReset().mockReturnValue(toast);
  toast.mockReset();
});

describe('run', () => {
  const { run } = useAction('task');

  it('shows nothing on success by default', async () => {
    await expect(run('update', () => Promise.resolve(1))).resolves.toBe(1);
    expect(notify).not.toHaveBeenCalled();
  });

  it('shows the success with result feedback', async () => {
    await run('update', () => Promise.resolve(1), { feedback: 'result' });

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'positive',
        message: 'stores.task.update.success',
      }),
    );
  });

  it('reports a failure once and rejects with it marked', async () => {
    const error = new Error('offline');

    await expect(run('update', () => Promise.reject(error))).rejects.toBe(
      error,
    );

    expect(isReportedError(error)).toBe(true);
    expect(notify).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'stores.task.update.error',
        caption: 'offline',
      }),
    );
  });

  it('wraps a non-error rejection so it can be marked', async () => {
    const rejection = await run('update', () =>
      Promise.reject('offline'),
    ).catch((err: unknown) => err);

    expect(rejection).toBeInstanceOf(Error);
    expect(isReportedError(rejection)).toBe(true);
  });

  it('uses a custom error message', async () => {
    await run('update', offline, { errorMessage: 'Custom' }).catch(
      () => undefined,
    );

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Custom', caption: 'offline' }),
    );
  });

  it('turns the progress toast into the outcome', async () => {
    await run(
      'update',
      (report) => {
        report('50 %');
        return Promise.resolve();
      },
      { feedback: 'progress' },
    );
    await run('update', offline, { feedback: 'progress' }).catch(
      () => undefined,
    );

    expect(notify).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenCalledWith({ caption: '50 %' });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' }),
    );
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', caption: 'offline' }),
    );
  });
});

describe('settleAll', () => {
  it('waits for every request before rejecting', async () => {
    let slowDone = false;
    const report = vi.fn();

    await expect(
      settleAll(
        [
          offline,
          () =>
            new Promise((resolve) =>
              setTimeout(() => {
                slowDone = true;
                resolve(1);
              }, 5),
            ),
        ],
        report,
      ),
    ).rejects.toThrow('offline');

    expect(slowDone).toBe(true);
    expect(report).toHaveBeenLastCalledWith('100 %');
  });

  it('returns the results in order', async () => {
    await expect(
      settleAll([() => Promise.resolve(1), () => Promise.resolve(2)], vi.fn()),
    ).resolves.toEqual([1, 2]);
  });
});

describe('extractErrorText', () => {
  const { extractErrorText } = useErrorExtractor();

  it('prefers the message from the response body', () => {
    expect(extractErrorText(httpError(409, { message: 'Taken' }))).toBe(
      'Taken',
    );
  });

  it('falls back when the body is empty or not JSON', () => {
    expect(extractErrorText(httpError(502, null, 'Bad Gateway'))).toBe(
      'Bad Gateway',
    );
    expect(extractErrorText(httpError(502, '<html>'))).toBe('service.unknown');
  });
});
