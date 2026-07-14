import { z } from 'zod';

const requiredS3Keys = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

const optionalS3Keys = ['S3_FORCE_PATH_STYLE', 'S3_OBJECT_PREFIX'] as const;

const s3Keys = [...requiredS3Keys, ...optionalS3Keys] as const;

const s3EnvShape = {
  S3_ENDPOINT: z.url().describe('S3 endpoint URL for S3-compatible providers'),

  S3_REGION: z.string().trim().min(1).describe('S3 region'),

  S3_BUCKET: z.string().trim().min(1).describe('S3 bucket name'),

  S3_ACCESS_KEY_ID: z.string().trim().min(1).describe('S3 access key ID'),

  S3_SECRET_ACCESS_KEY: z.string().min(1).describe('S3 secret access key'),

  S3_FORCE_PATH_STYLE: z
    .stringbool()
    .default(true)
    .describe('Use S3 path-style URL format'),

  S3_OBJECT_PREFIX: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe('Optional object-key prefix for uploaded files'),
};

const CommonStorageEnvSchema = z.object({
  TMP_DIR: z
    .string()
    .default('storage/tmp')
    .describe('Directory where unprocessed files are stored'),

  UPLOAD_DIR: z
    .string()
    .default('storage/uploads')
    .describe('Directory where uploaded files are stored'),

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
        'rest (32-byte keys, e.g. `openssl rand -base64 32`). Only the ' +
        'first key encrypts new files; the remaining keys can only decrypt ' +
        'files written while they were first, so rotating a compromised ' +
        'key to a later position protects everything uploaded afterwards. ' +
        'Unset disables encryption.',
    )
    .optional(),
  MAX_FILE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(100e6)
    .describe('Maximum size of uploaded files in bytes'),
});

const optionalS3EnvShape = {
  S3_ENDPOINT: s3EnvShape.S3_ENDPOINT.optional(),
  S3_REGION: s3EnvShape.S3_REGION.optional(),
  S3_BUCKET: s3EnvShape.S3_BUCKET.optional(),
  S3_ACCESS_KEY_ID: s3EnvShape.S3_ACCESS_KEY_ID.optional(),
  S3_SECRET_ACCESS_KEY: s3EnvShape.S3_SECRET_ACCESS_KEY.optional(),
  S3_FORCE_PATH_STYLE: z
    .stringbool()
    .optional()
    .describe('Use S3 path-style URL format'),
  S3_OBJECT_PREFIX: s3EnvShape.S3_OBJECT_PREFIX,
};

const DiskStorageEnvSchema = CommonStorageEnvSchema.extend({
  STORAGE_LOCATION: z.literal('disk'),
  ...optionalS3EnvShape,
}).superRefine((data, ctx) => {
  const hasAnyS3Config = s3Keys.some((key) => Object.hasOwn(data, key));

  if (!hasAnyS3Config) {
    return;
  }

  for (const key of requiredS3Keys) {
    if (!Object.hasOwn(data, key)) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: 'Required when any S3 storage setting is configured.',
      });
    }
  }
});

const S3StorageEnvSchema = CommonStorageEnvSchema.extend({
  STORAGE_LOCATION: z.literal('s3'),
  ...s3EnvShape,
});

const StorageEnvUnionSchema = z.discriminatedUnion('STORAGE_LOCATION', [
  DiskStorageEnvSchema,
  S3StorageEnvSchema,
]);

/**
 * STORAGE_LOCATION defaults to "disk" when it is not present, and the legacy
 * "local" value (the previous default) is normalized to "disk" so existing
 * deployments keep booting after the rename.
 *
 * Both are resolved before evaluating the discriminated union because the
 * discriminator is required to select the appropriate branch.
 */
export const StorageEnvSchema = z.preprocess((input) => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return input;
  }

  const data = input as Record<string, unknown>;

  const location =
    data.STORAGE_LOCATION === undefined || data.STORAGE_LOCATION === 'local'
      ? 'disk'
      : data.STORAGE_LOCATION;

  return {
    ...data,
    STORAGE_LOCATION: location,
  };
}, StorageEnvUnionSchema);

export type StorageEnv = z.output<typeof StorageEnvSchema>;
