import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import argon2 from 'argon2';
import {
  encryptPassword,
  isPasswordMatch,
  passwordNeedsRehash,
} from '#core/encryption';

describe('encryptPassword', () => {
  it('produces an argon2 hash', async () => {
    const hash = await encryptPassword('Password1');

    expect(hash.startsWith('$argon2')).toBe(true);
  });
});

describe('isPasswordMatch', () => {
  it('matches a password against an argon2 hash', async () => {
    const hash = await argon2.hash('Password1');

    await expect(isPasswordMatch('Password1', hash)).resolves.toBe(true);
    await expect(isPasswordMatch('wrong', hash)).resolves.toBe(false);
  });

  it('matches a password against a legacy bcrypt hash', async () => {
    const hash = bcrypt.hashSync('Password1', 8);

    await expect(isPasswordMatch('Password1', hash)).resolves.toBe(true);
    await expect(isPasswordMatch('wrong', hash)).resolves.toBe(false);
  });
});

describe('passwordNeedsRehash', () => {
  it('returns true for a legacy bcrypt hash', () => {
    const hash = bcrypt.hashSync('Password1', 8);

    expect(passwordNeedsRehash(hash)).toBe(true);
  });

  it('returns false for an argon2 hash', async () => {
    const hash = await argon2.hash('Password1');

    expect(passwordNeedsRehash(hash)).toBe(false);
  });
});
