import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('initials', () => {
  it('takes the first and last name', () => {
    expect(initials('anna maria  Weber')).toBe('AW');
  });

  it('takes one letter of a single name', () => {
    expect(initials(' Anna ')).toBe('A');
  });

  it('is empty without a name', () => {
    expect(initials('')).toBe('');
    expect(initials(null)).toBe('');
  });
});
