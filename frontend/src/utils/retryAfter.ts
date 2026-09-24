import { isAxiosError } from 'axios';

// Delay in ms requested by a response's Retry-After header (seconds or HTTP date).
export function retryAfterMs(error: unknown): number | undefined {
  if (!isAxiosError(error)) {
    return undefined;
  }

  const header: unknown = error.response?.headers['retry-after'];
  if (typeof header !== 'string' || header.trim() === '') {
    return undefined;
  }

  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}
