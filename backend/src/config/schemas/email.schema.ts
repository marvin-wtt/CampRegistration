import { z } from 'zod';

export const EmailEnvSchema = z.object({
  EMAIL_DRIVER: z.enum(['smtp', 'noop']).default('smtp'),
  EMAIL_FROM: z
    .email()
    .describe('The from field in the emails sent by the app.'),
  EMAIL_REPLY_TO: z
    .email()
    .optional()
    .describe('The replyTo field in the emails sent by the app.'),
  EMAIL_ADMIN: z
    .email()
    .describe('The email to send operational notifications to.'),
  SMTP_HOST: z
    .string()
    .default('localhost')
    .describe('Server that will send the emails'),
  SMTP_PORT: z.coerce
    .number()
    .min(0)
    .max(65535)
    .describe('Port to connect to the email server')
    .default(587),
  SMTP_SECURE: z
    .stringbool()
    .describe('Encrypt the connection to the server')
    .default(true),
  SMTP_USERNAME: z.string().optional().describe('Username for email server'),
  SMTP_PASSWORD: z.string().optional().describe('Password for email server'),
});
