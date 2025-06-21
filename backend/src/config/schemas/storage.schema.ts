import { z } from 'zod';
import path from 'path';

export const StorageEnvSchema = z.object({
  TMP_DIR: z
    .string()
    .describe('Directory where unprocessed files are stored')
    .default(path.join('storage', 'tmp') + path.sep),
  UPLOAD_DIR: z
    .string()
    .describe('Directory where uploaded files are stored')
    .default(path.join('storage', 'uploads') + path.sep),
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
