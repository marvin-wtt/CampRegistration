import { z } from 'zod';

export const MainEnvSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  APP_PORT: z.coerce
    .number()
    .min(0)
    .max(65535)
    .describe('The port on which is app listens')
    .default(8000),
  APP_URL: z.url().describe('URL, where the app is hosted.'),
  APP_NAME: z.string().readonly().describe('The name of the app.'),
  APP_PRIMARY_COLOR: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#338d8e')
    .describe('Primary color used in email templates.'),
  SENTRY_DSN: z.url().optional().describe('Sentry DSN for error tracking.'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .optional()
    .describe('Override the default log level.'),
  RATE_LIMIT_DISABLED: z
    .stringbool()
    .default(false)
    .describe('Disable IP rate limiting. Opt-in override for e2e tests.'),
});

export type MainEnv = z.output<typeof MainEnvSchema>;
