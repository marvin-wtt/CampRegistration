import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '#core/secrets';

describe('secrets', () => {
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
});
