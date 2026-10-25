import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import datetimeFormats from '@/i18n/datetimeFormats';

// The global setup mocks vue-i18n; this test is about its real formatting.
vi.unmock('vue-i18n');

const dateTime = (locale: string) =>
  createI18n({ legacy: false, locale, datetimeFormats }).global.d(
    new Date(2027, 6, 1, 9, 0),
    'dateTime',
  );

describe('datetimeFormats', () => {
  // vue-i18n formats in the locale it found the format under, so without its
  // own entry `en-GB` would fall back to `en` and render American dates.
  it('formats British English day first, on a 24-hour clock', () => {
    expect(dateTime('en-GB')).toBe('01/07/2027, 09:00');
  });

  it('keeps American English month first', () => {
    expect(dateTime('en-US')).toBe('07/01/2027, 09:00 AM');
  });
});
