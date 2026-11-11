import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  useErrorExtractor,
  useServiceHandler,
} from '@/composables/serviceHandler';
import { isReportedError } from '@/utils/reportedError';

const notify = vi.fn();
const updateNotification = vi.fn();

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify }),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

const offline = () => Promise.reject(new Error('offline'));

beforeEach(() => {
  notify.mockReset().mockReturnValue(updateNotification);
  updateNotification.mockReset();
});

describe('mutate', () => {
  it('returns the value without notifying on success', async () => {
    const { mutate } = useServiceHandler<string[]>('task');

    await expect(mutate('update', () => Promise.resolve(42))).resolves.toBe(42);
    expect(notify).not.toHaveBeenCalled();
  });

  it('reports a failure, reloads and rejects with a reported error', async () => {
    const reload = vi.fn(() => Promise.resolve());
    const { mutate } = useServiceHandler<string[]>('task', { reload });
    const error = new Error('offline');

    await expect(mutate('update', () => Promise.reject(error))).rejects.toBe(
      error,
    );

    expect(isReportedError(error)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'stores.task.update.error',
        caption: 'offline',
      }),
    );
  });

  it('skips a follow-up after a failure', async () => {
    const { mutate } = useServiceHandler<string[]>('task');
    const followUp = vi.fn();

    await mutate('update', offline)
      .then(followUp)
      .catch(() => undefined);

    expect(followUp).not.toHaveBeenCalled();
  });

  it('marks non-error rejections as well', async () => {
    const { mutate } = useServiceHandler<string[]>('task');

    const rejection = await mutate('update', () =>
      Promise.reject('offline'),
    ).catch((err: unknown) => err);

    expect(isReportedError(rejection)).toBe(true);
  });

  it('still rejects with the original error when the reload fails or throws', async () => {
    const rejecting = useServiceHandler<string[]>('task', {
      reload: () => Promise.reject(new Error('reload')),
    });
    const throwing = useServiceHandler<string[]>('task', {
      reload: () => {
        throw new Error('no event');
      },
    });

    await expect(rejecting.mutate('update', offline)).rejects.toThrow(
      'offline',
    );
    await expect(throwing.mutate('update', offline)).rejects.toThrow('offline');
    await flushPromises();
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it('turns the progress toast into the error instead of a second toast', async () => {
    const { mutate } = useServiceHandler<string[]>('task');

    await expect(mutate('update', offline, { progress: true })).rejects.toThrow(
      'offline',
    );

    expect(notify).toHaveBeenCalledOnce();
    expect(updateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', caption: 'offline' }),
    );
  });

  it('counts as pending while it runs, also when it fails', async () => {
    const { mutate, requestPending } = useServiceHandler<string[]>('task');
    const request = deferred<number>();

    const running = mutate('update', () => request.promise).catch(
      () => undefined,
    );
    expect(requestPending.value).toBe(true);

    request.reject(new Error('offline'));
    await running;
    expect(requestPending.value).toBe(false);
  });
});

describe('rethrowing helpers', () => {
  it('mark what withResultNotification rethrows', async () => {
    const { withResultNotification } = useServiceHandler('task');

    const rejection = await withResultNotification('update', offline).catch(
      (err: unknown) => err,
    );

    expect(isReportedError(rejection)).toBe(true);
  });
});

describe('fetching', () => {
  it('retries a failed load on the next lazy fetch', async () => {
    const { data, error, lazyFetch } = useServiceHandler<string[]>('task');
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(['a']);

    await lazyFetch(fetcher);
    expect(error.value).toBe('offline');

    await lazyFetch(fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(data.value).toEqual(['a']);
    expect(error.value).toBeNull();
  });

  it('ends the loading state when a reload supersedes a first load', async () => {
    const { data, isLoading, lazyFetch, backgroundFetch } =
      useServiceHandler<string[]>('task');
    const load = deferred<string[]>();

    const loading = lazyFetch(() => load.promise);
    expect(isLoading.value).toBe(true);

    await backgroundFetch(() => Promise.resolve(['fresh']));
    load.resolve(['stale']);
    await loading;

    expect(isLoading.value).toBe(false);
    expect(data.value).toEqual(['fresh']);
  });

  it('reports the error of a reload that superseded a first load', async () => {
    const { error, isLoading, lazyFetch, backgroundFetch } =
      useServiceHandler<string[]>('task');
    const load = deferred<string[]>();

    const loading = lazyFetch(() => load.promise);
    await backgroundFetch(offline);
    load.resolve(['stale']);
    await loading;

    expect(isLoading.value).toBe(false);
    expect(error.value).toBe('offline');
  });

  it('keeps the data and shows no error when a background reload fails', async () => {
    const { data, error, lazyFetch, backgroundFetch } =
      useServiceHandler<string[]>('task');
    await lazyFetch(() => Promise.resolve(['a']));

    await backgroundFetch(offline);

    expect(data.value).toEqual(['a']);
    expect(error.value).toBeNull();
  });

  it('shows no error for a failed reload after a reset', async () => {
    const { error, reset, backgroundFetch } =
      useServiceHandler<string[]>('task');
    reset();

    await backgroundFetch(offline);

    expect(error.value).toBeNull();
  });
});

describe('asyncUpdate', () => {
  it('stops counting when the update throws synchronously', async () => {
    const { asyncUpdate, requestPending } = useServiceHandler('task');

    await expect(
      asyncUpdate(() => {
        throw new Error('bug');
      }),
    ).rejects.toThrow('bug');
    expect(requestPending.value).toBe(false);
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

describe('isReportedError', () => {
  it('marks errors a notifying helper rethrows', async () => {
    const { withProgressNotification } = useServiceHandler('task');
    const error = new Error('offline');

    await expect(
      withProgressNotification('update', () => Promise.reject(error)),
    ).rejects.toBe(error);

    expect(isReportedError(error)).toBe(true);
    expect(isReportedError(new Error('other'))).toBe(false);
    expect(isReportedError('offline')).toBe(false);
  });
});
