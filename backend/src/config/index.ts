import { env } from '#config/enviroment';
import { appPath } from '#utils/paths';

interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  objectPrefix?: string;
}

function hasS3Config(
  value: typeof env,
): value is typeof env &
  Required<
    Pick<
      typeof env,
      | 'S3_ENDPOINT'
      | 'S3_REGION'
      | 'S3_BUCKET'
      | 'S3_ACCESS_KEY_ID'
      | 'S3_SECRET_ACCESS_KEY'
    >
  > {
  return value.S3_ENDPOINT !== undefined;
}

function s3Config(): S3Config | undefined {
  if (!hasS3Config(env)) {
    return undefined;
  }

  return {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: env.S3_FORCE_PATH_STYLE ?? true,
    objectPrefix: env.S3_OBJECT_PREFIX,
  };
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
    location: env.STORAGE_LOCATION,
    tmpDir: appPath(env.TMP_DIR),
    uploadDir: appPath(env.UPLOAD_DIR),
    staticDir: appPath(env.STATIC_DIR),
    maxFileSize: env.MAX_FILE_SIZE,
    encryptionKeys: env.STORAGE_ENCRYPTION_KEYS,
    s3: s3Config(),
  },
  csrf: {
    secret: env.CSRF_SECRET,
  },
  totp: {
    recoveryCodeSecret: env.TOTP_RECOVERY_CODE_SECRET,
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
  surveyjs: {
    licenceKey: env.SURVEYJS_LICENSE_KEY,
  },
  log: {
    level: env.LOG_LEVEL,
  },
  rateLimit: {
    disabled: env.RATE_LIMIT_DISABLED,
  },
};

export type StorageConfig = (typeof config)['storage'];
export type AppConfig = typeof config;

export default config;
