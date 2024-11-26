import { z } from 'zod';
import { validateEnv } from 'core/validation/env';
import { BooleanStringSchema } from 'core/validation/helper';

export const EmailEnvSchema = z
  .object({
    SMTP_HOST: z.string().describe('Server that will send the emails'),
    SMTP_PORT: z.coerce
      .number()
      .min(0)
      .max(65535)
      .describe('Port to connect to the email server'),
    // .default(587),
    SMTP_SECURE: BooleanStringSchema.describe(
      'Encrypt the connection to the server',
    ),
    // .default(false),
    SMTP_USERNAME: z.string().describe('Username for email server'),
    SMTP_PASSWORD: z.string().describe('Password for email server'),
    EMAIL_FROM: z
      .string()
      .email()
      .describe('The from field in the emails sent by the app.'),
    EMAIL_REPLY_TO: z
      .string()
      .email()
      .describe('The replyTo field in the emails sent by the app.'),
    EMAIL_ADMIN: z
      .string()
      .email()
      .describe('The email to send operational notifications to.'),
  })
  .readonly();

const envVars = validateEnv(EmailEnvSchema);

export default {
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    secure: envVars.SMTP_SECURE,
    auth: {
      user: envVars.SMTP_USERNAME,
      pass: envVars.SMTP_PASSWORD,
    },
  },
  from: envVars.EMAIL_FROM,
  replyTo: envVars.EMAIL_REPLY_TO,
  admin: envVars.EMAIL_ADMIN,
};
