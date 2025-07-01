import { z } from 'zod/v4';

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
});
