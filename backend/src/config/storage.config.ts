import { z } from 'zod';
import path from 'path';
import fse from 'fs-extra';
import { validateEnv } from 'core/validation/env';

export const StorageEnvSchema = z
  .object({
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
  })
  .readonly();

const envVars = validateEnv(StorageEnvSchema);

const createPath = (dir: string): string => {
  return dir.replaceAll('/', path.sep);
};

const storageOptions = {
  location: envVars.STORAGE_LOCATION,
  tmpDir: createPath(envVars.TMP_DIR),
  uploadDir: createPath(envVars.UPLOAD_DIR),
  staticDir: path.join('storage', 'static') + path.sep,
  maxFileSize: envVars.MAX_FILE_SIZE,
};

// TODO This should not happen here
{
  if (storageOptions.tmpDir) {
    fse.ensureDirSync(storageOptions.tmpDir);
  }
  if (storageOptions.uploadDir) {
    fse.ensureDirSync(storageOptions.uploadDir);
  }
}

export default storageOptions;
