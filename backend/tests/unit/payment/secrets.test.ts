import { afterEach, describe, expect, it } from 'vitest';
import config from '#config/index';
import {
  decryptSecret,
  encryptSecret,
  resetSecretsKeyring,
  secretsAvailable,
} from '#core/secrets';

describe('secrets', () => {
  afterEach(() => {
    resetSecretsKeyring();
  });

  it('round-trips a secret', async () => {
    const ciphertext = await encryptSecret(
      'sk_test_123',
      'payment-credentials',
    );

    expect(ciphertext).not.toContain('sk_test_123');
    await expect(
      decryptSecret(ciphertext, 'payment-credentials'),
    ).resolves.toBe('sk_test_123');
  });

  it('refuses a secret encrypted for another purpose', async () => {
    const ciphertext = await encryptSecret('value', 'other');

    await expect(
      decryptSecret(ciphertext, 'payment-credentials'),
    ).rejects.toThrow();
  });

  it('never falls back to the file storage keys', () => {
    const secretKeys = config.secrets.encryptionKeys;
    const storageKeys = config.storage.encryptionKeys;
    config.secrets.encryptionKeys = undefined;
    config.storage.encryptionKeys = `k20260101-01:${'A'.repeat(43)}=`;
    resetSecretsKeyring();

    try {
      expect(secretsAvailable()).toBe(false);
    } finally {
      config.secrets.encryptionKeys = secretKeys;
      config.storage.encryptionKeys = storageKeys;
    }
  });

  it('names its own setting when a key is malformed', () => {
    const secretKeys = config.secrets.encryptionKeys;
    config.secrets.encryptionKeys = 'k20260101-01:too-short';
    resetSecretsKeyring();

    try {
      expect(() => secretsAvailable()).toThrow(/^SECRETS_ENCRYPTION_KEYS/);
    } finally {
      config.secrets.encryptionKeys = secretKeys;
    }
  });
});
