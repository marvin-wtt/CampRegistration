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
    .enum(['disk', 'local', 's3', 'static'])
    .describe('Location where new files should be stored to')
    .default('disk'),
  MAX_FILE_SIZE: z.coerce
    .number()
    .positive()
    .describe('Maximum size of uploaded files')
    .default(100e6),
  S3_ENDPOINT: z
    .url()
    .optional()
    .describe('S3 endpoint URL for S3 compatible providers'),
  S3_REGION: z
    .string()
    .min(1)
    .optional()
    .describe('S3 region'),
  S3_BUCKET: z
    .string()
    .min(1)
    .optional()
    .describe('S3 bucket name'),
  S3_ACCESS_KEY_ID: z
    .string()
    .min(1)
    .optional()
    .describe('S3 access key ID'),
  S3_SECRET_ACCESS_KEY: z
    .string()
    .min(1)
    .optional()
    .describe('S3 secret access key'),
  S3_FORCE_PATH_STYLE: z
    .stringbool()
    .default(true)
    .describe('Use S3 path-style URL format'),
  S3_OBJECT_PREFIX: z
    .string()
    .optional()
    .describe('Optional object-key prefix for uploaded files'),
  S3_PRESIGNED_DOWNLOAD_LIFETIME_SECONDS: z.coerce
    .number()
    .int()
    .gt(0)
    .lte(300)
    .default(60)
    .describe('Presigned S3 download URL lifetime in seconds'),
});
