import { describe, expect, it } from 'vitest';
import { emptyStringsToNull } from '#core/router/string.middleware';

describe('emptyStringsToNull', () => {
  it('should convert empty strings to null', () => {
    expect(emptyStringsToNull({ a: '', b: 'x', c: 0 })).toEqual({
      a: null,
      b: 'x',
      c: 0,
    });
  });

  it('should convert nested objects', () => {
    expect(emptyStringsToNull({ a: { b: '' } })).toEqual({ a: { b: null } });
  });

  it('should leave arrays untouched', () => {
    expect(emptyStringsToNull({ a: ['', 'x'] })).toEqual({ a: ['', 'x'] });
  });

  it('should pass non-objects through', () => {
    expect(emptyStringsToNull(undefined)).toBeUndefined();
    expect(emptyStringsToNull('')).toBe('');
  });
});
