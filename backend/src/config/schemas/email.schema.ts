import { z } from 'zod/v4';

export const EmailEnvSchema = z.object({
  SMTP_HOST: z.string().describe('Server that will send the emails'),
  SMTP_PORT: z.coerce
    .number()
    .min(0)
    .max(65535)
    .describe('Port to connect to the email server'),
  // .default(587),
  SMTP_SECURE: z.stringbool().describe('Encrypt the connection to the server'),
  // .default(false),
  SMTP_USERNAME: z.string().describe('Username for email server'),
  SMTP_PASSWORD: z.string().describe('Password for email server'),
  EMAIL_FROM: z
    .email()
    .describe('The from field in the emails sent by the app.'),
  EMAIL_REPLY_TO: z
    .email()
    .describe('The replyTo field in the emails sent by the app.'),
  EMAIL_ADMIN: z
    .email()
    .describe('The email to send operational notifications to.'),
});
