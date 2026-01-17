import { env } from '#config/enviroment';
import { appPath } from '#utils/paths.js';

const config = {
  env: env.NODE_ENV,
  appName: env.APP_NAME,
  port: env.APP_PORT,
  origin: env.APP_URL,
  jwt: {
    secret: env.JWT_SECRET,
    accessExpirationMinutes: env.TOKEN_EXPIRATION_ACCESS,
    refreshExpirationDays: env.TOKEN_EXPIRATION_REFRESH,
    resetPasswordExpirationMinutes: env.TOKEN_EXPIRATION_RESET_PASSWORD,
    verifyEmailExpirationMinutes: env.TOKEN_EXPIRATION_VERIFY_EMAIL,
  },
  email: {
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
};

export type StorageConfig = (typeof config)['storage'];
export type AppConfig = typeof config;

export default config;
