import { env } from '#config/enviroment';
import { appPath } from '#utils/paths';

const normalizeStorageLocation = (
  location: 'disk' | 'local' | 's3' | 'static',
): 'disk' | 's3' | 'static' => {
  return location === 'local' ? 'disk' : location;
};

const storageLocation = normalizeStorageLocation(env.STORAGE_LOCATION);

const storageS3Config =
  storageLocation === 's3'
    ? {
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        bucket: env.S3_BUCKET,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        objectPrefix: env.S3_OBJECT_PREFIX,
        presignedDownloadLifetimeSeconds:
          env.S3_PRESIGNED_DOWNLOAD_LIFETIME_SECONDS,
      }
    : undefined;

if (
  storageLocation === 's3' &&
  (!storageS3Config?.endpoint ||
    !storageS3Config.region ||
    !storageS3Config.bucket)
) {
  throw new Error(
    'S3_ENDPOINT, S3_REGION and S3_BUCKET must be configured when STORAGE_LOCATION is set to "s3".',
  );
}

const config = {
  env: env.NODE_ENV,
  appName: env.APP_NAME,
  primaryColor: env.APP_PRIMARY_COLOR,
  port: env.APP_PORT,
  origin: env.APP_URL,
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpirationMinutes: env.TOKEN_EXPIRATION_ACCESS,
    refreshExpirationDays: env.TOKEN_EXPIRATION_REFRESH,
    resetPasswordExpirationMinutes: env.TOKEN_EXPIRATION_RESET_PASSWORD,
    verifyEmailExpirationMinutes: env.TOKEN_EXPIRATION_VERIFY_EMAIL,
  },
  email: {
    driver: env.EMAIL_DRIVER,
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO,
    admin: env.EMAIL_ADMIN,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USERNAME,
        pass: env.SMTP_PASSWORD,
      },
    },
  },
  storage: {
    location: storageLocation,
    tmpDir: appPath(env.TMP_DIR),
    uploadDir: appPath(env.UPLOAD_DIR),
    staticDir: appPath(env.STATIC_DIR),
    maxFileSize: env.MAX_FILE_SIZE,
    s3: storageS3Config,
  },
  csrf: {
    secret: env.CSRF_SECRET,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    username: env.REDIS_USERNAME,
  },
  queue: {
    driver: env.QUEUE_DRIVER,
  },
  realtime: {
    // A redis queue implies a multi-instance deployment, where realtime must
    // fan out across processes too.
    driver:
      env.REALTIME_DRIVER ??
      (env.QUEUE_DRIVER === 'redis' ? ('redis' as const) : ('memory' as const)),
  },
  sentry: {
    dsn: env.SENTRY_DSN,
  },
  log: {
    level: env.LOG_LEVEL,
  },
};

export type StorageConfig = (typeof config)['storage'];
export type AppConfig = typeof config;

export default config;
