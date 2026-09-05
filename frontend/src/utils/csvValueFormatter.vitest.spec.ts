import { describe, expect, it, vi } from 'vitest';
import {
  formatFormSelectCsvValue,
  formatIsoDateCsvValue,
  isTranslatableCsvValue,
  stringifyCsvValue,
  type CsvFormatContext,
} from '@/utils/csvValueFormatter';

describe('stringifyCsvValue', () => {
  it('renders nullish values as an empty string', () => {
    expect(stringifyCsvValue(null)).toBe('');
    expect(stringifyCsvValue(undefined)).toBe('');
  });

  it('joins arrays with a semicolon', () => {
    expect(stringifyCsvValue(['a@example.com', 'b@example.com'])).toBe(
      'a@example.com; b@example.com',
    );
  });

  it('falls back to JSON for plain objects', () => {
    expect(stringifyCsvValue({ foo: 'bar' })).toBe('{"foo":"bar"}');
  });

  it('stringifies primitives', () => {
    expect(stringifyCsvValue(42)).toBe('42');
    expect(stringifyCsvValue(true)).toBe('true');
  });
});

describe('isTranslatableCsvValue', () => {
  it('accepts strings and non-null objects', () => {
    expect(isTranslatableCsvValue('Room A')).toBe(true);
    expect(isTranslatableCsvValue({ en: 'Room A' })).toBe(true);
  });

  it('rejects null, numbers, and other primitives', () => {
    expect(isTranslatableCsvValue(null)).toBe(false);
    expect(isTranslatableCsvValue(42)).toBe(false);
    expect(isTranslatableCsvValue(undefined)).toBe(false);
  });
});

describe('formatIsoDateCsvValue', () => {
  it('formats an ISO datetime string as a plain calendar day', () => {
    expect(formatIsoDateCsvValue('2010-05-01T00:00:00.000Z')).toBe(
      '2010-05-01',
    );
  });

  it('falls back to the generic stringifier for non-string values', () => {
    expect(formatIsoDateCsvValue(null)).toBe('');
    expect(formatIsoDateCsvValue(42)).toBe('42');
  });
});

function makeContext(
  overrides: Partial<CsvFormatContext> = {},
): CsvFormatContext {
  return {
    translate: (value) =>
      typeof value === 'string' ? value : (value?.en ?? ''),
    translateCountry: (country) => country.toUpperCase(),
    getFormSelectOptions: () => undefined,
    ...overrides,
  };
}

describe('formatFormSelectCsvValue', () => {
  it('resolves the option label for data.* fields', () => {
    const getFormSelectOptions = vi.fn().mockReturnValue({
      opt1: { en: 'Option 1' },
    });
    const ctx = makeContext({ getFormSelectOptions });

    expect(formatFormSelectCsvValue('data.favoriteColor', 'opt1', ctx)).toBe(
      'Option 1',
    );
    expect(getFormSelectOptions).toHaveBeenCalledWith('favoriteColor');
  });

  it('falls back to the raw value when the option is unknown', () => {
    const ctx = makeContext({ getFormSelectOptions: () => undefined });
    expect(formatFormSelectCsvValue('data.favoriteColor', 'unknown', ctx)).toBe(
      'unknown',
    );
  });

  it('falls back to the raw value for non-form fields', () => {
    const ctx = makeContext();
    expect(
      formatFormSelectCsvValue('computedData.role', 'participant', ctx),
    ).toBe('participant');
  });
});
