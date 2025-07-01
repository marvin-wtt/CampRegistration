import { z } from 'zod/v4';

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
  MAX_FILE_SIZE: z.coerce
    .number()
    .positive()
    .describe('Maximum size of uploaded files')
    .default(100e6),
});
