import { describe, expect, it } from 'vitest';
import { maskEmail } from '#utils/maskEmail';

describe('maskEmail', () => {
  it('keeps the first character and the domain', () => {
    expect(maskEmail('jane.doe@example.com')).toBe('j***@example.com');
  });

  it('fully masks a value without a usable local part', () => {
    expect(maskEmail('@example.com')).toBe('***');
    expect(maskEmail('not-an-email')).toBe('***');
  });
});
