import { z } from 'zod';

export const SecretsEnvSchema = z.object({
  SECRETS_ENCRYPTION_KEYS: z
    .string()
    .describe(
      'Comma-separated `keyId:base64Key` master keys for secrets stored in ' +
        'the database, such as payment provider API keys (32-byte keys, e.g. ' +
        '`openssl rand -base64 32`). Only the first key encrypts; the others ' +
        'still decrypt what they encrypted. Separate from ' +
        'STORAGE_ENCRYPTION_KEYS. Unset, no secrets can be stored.',
    )
    .optional(),
});

export type SecretsEnv = z.output<typeof SecretsEnvSchema>;
