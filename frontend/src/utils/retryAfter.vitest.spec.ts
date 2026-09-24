import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { retryAfterMs } from '@/utils/retryAfter';

function errorWithRetryAfter(value?: string): AxiosError {
  const headers = new AxiosHeaders();
  if (value !== undefined) {
    headers.set('retry-after', value);
  }

  return new AxiosError(
    'Too Many Requests',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status: 429,
      statusText: 'Too Many Requests',
      headers,
      config: { headers: new AxiosHeaders() },
      data: undefined,
    },
  );
}

describe('retryAfterMs', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads delay seconds', () => {
    expect(retryAfterMs(errorWithRetryAfter('30'))).toBe(30_000);
  });

  it('reads an HTTP date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    expect(
      retryAfterMs(errorWithRetryAfter('Thu, 01 Jan 2026 00:00:10 GMT')),
    ).toBe(10_000);
  });

  it('returns undefined without a usable header', () => {
    expect(retryAfterMs(errorWithRetryAfter())).toBeUndefined();
    expect(retryAfterMs(errorWithRetryAfter('soon'))).toBeUndefined();
    expect(retryAfterMs(new Error('network'))).toBeUndefined();
  });
});
