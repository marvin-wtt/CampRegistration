import { describe, expect, it } from 'vitest';
import { matchesText } from './textSearch';

describe('matchesText', () => {
  it('matches everything for an empty query', () => {
    expect(matchesText('', ['a'])).toBe(true);
    expect(matchesText(null, [])).toBe(true);
  });

  it('ignores case and accents', () => {
    expect(matchesText('jose', ['José Müller'])).toBe(true);
    expect(matchesText('MULLER', ['José Müller'])).toBe(true);
  });

  it('needs every word, each in any field', () => {
    expect(matchesText('bus lidl', ['Busfahrt', 'Lidl'])).toBe(true);
    expect(matchesText('bus aldi', ['Busfahrt', 'Lidl'])).toBe(false);
  });

  it('skips empty fields', () => {
    expect(matchesText('x', [null, undefined, ''])).toBe(false);
  });
});
