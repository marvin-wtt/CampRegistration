import { describe, expect, it } from 'vitest';
import {
  csvSeparatorForLocale,
  escapeCsvField,
  toCsv,
  toCsvRow,
} from '@/utils/csv';

describe('escapeCsvField', () => {
  it('returns plain values unchanged', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField('')).toBe('');
  });

  it('quotes values containing a comma', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
  });

  it('quotes on the given separator instead of a hardcoded comma', () => {
    // A comma is no longer special once `;` is the active separator...
    expect(escapeCsvField('a,b', ';')).toBe('a,b');
    // ...and vice versa.
    expect(escapeCsvField('a;b', ';')).toBe('"a;b"');
    expect(escapeCsvField('a;b', ',')).toBe('a;b');
  });

  it('quotes and doubles embedded double quotes', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('quotes values containing embedded newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });
});

describe('toCsvRow', () => {
  it('joins escaped fields with commas', () => {
    expect(toCsvRow(['a', 'b,c', 'd'])).toBe('a,"b,c",d');
  });

  it('joins with the given separator', () => {
    expect(toCsvRow(['a', 'b', 'c'], ';')).toBe('a;b;c');
  });
});

describe('toCsv', () => {
  it('joins header and rows with CRLF', () => {
    expect(
      toCsv(
        ['name', 'age'],
        [
          ['Alice', '30'],
          ['Bob', '25'],
        ],
      ),
    ).toBe('name,age\r\nAlice,30\r\nBob,25');
  });

  it('preserves column count when a value is empty', () => {
    expect(toCsv(['a', 'b'], [['', 'x']])).toBe('a,b\r\n,x');
  });

  it('uses the given separator throughout', () => {
    expect(toCsv(['name', 'age'], [['Alice', '30']], ';')).toBe(
      'name;age\r\nAlice;30',
    );
  });
});

describe('csvSeparatorForLocale', () => {
  it('uses a comma for English', () => {
    expect(csvSeparatorForLocale('en')).toBe(',');
  });

  it('uses a semicolon for German, French, Polish, and Czech', () => {
    expect(csvSeparatorForLocale('de')).toBe(';');
    expect(csvSeparatorForLocale('fr')).toBe(';');
    expect(csvSeparatorForLocale('pl')).toBe(';');
    expect(csvSeparatorForLocale('cs')).toBe(';');
  });

  it('matches on the base language of a region-tagged locale', () => {
    expect(csvSeparatorForLocale('de-DE')).toBe(';');
    expect(csvSeparatorForLocale('en-US')).toBe(',');
  });

  it('falls back to a comma for unknown locales', () => {
    expect(csvSeparatorForLocale('ja')).toBe(',');
  });
});
