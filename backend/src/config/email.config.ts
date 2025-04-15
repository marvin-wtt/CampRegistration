import { env } from '#config/enviroment';

export default {
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  },
  from: env.EMAIL_FROM,
  replyTo: env.EMAIL_REPLY_TO,
  admin: env.EMAIL_ADMIN,
};
