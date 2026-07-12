import { z } from 'zod';

export const StorageEnvSchema = z.object({
  TMP_DIR: z
    .string()
    .describe('Directory where unprocessed files are stored')
    .default('storage/tmp'),
  UPLOAD_DIR: z
    .string()
    .describe('Directory where uploaded files are stored')
    .default('storage/uploads'),
  STATIC_DIR: z
    .string()
    .describe('Directory from which static files are served')
    .default('storage/static'),
  STORAGE_LOCATION: z
    .string()
    .describe('Location where new files should be stored to')
    .default('local'),
  STORAGE_ENCRYPTION_KEYS: z
    .string()
    .describe(
      'Comma-separated `keyId:base64Key` master keys for file encryption at ' +
        'rest (32-byte keys, e.g. `openssl rand -base64 32`). The first key ' +
        'encrypts new files; older keys remain valid for decryption. ' +
        'Unset disables encryption.',
    )
    .optional(),
  MAX_FILE_SIZE: z.coerce
    .number()
    .positive()
    .describe('Maximum size of uploaded files')
    .default(100e6),
});
