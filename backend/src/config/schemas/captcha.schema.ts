import { z } from 'zod';

export const CaptchaEnvSchema = z
  .object({
    CAPTCHA_DRIVER: z
      .enum(['turnstile'])
      .readonly()
      .optional()
      .describe(
        'Bot protection for public forms (signup, forgot password, ' +
          'registrations, contact). Unset (default) disables it.',
      ),

    TURNSTILE_SITE_KEY: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe(
        'Cloudflare Turnstile site key. Public; served to the frontend at ' +
          'runtime.',
      ),
    TURNSTILE_SECRET: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('Cloudflare Turnstile secret key'),
    TURNSTILE_HOSTNAMES: z
      .string()
      .optional()
      .describe(
        'Comma-separated hostnames a Turnstile token may be issued for. ' +
          'Defaults to the hostname of APP_URL.',
      )
      .meta({ examples: ['example.com,www.example.com'] }),
  })
  .superRefine((data, ctx) => {
    if (data.CAPTCHA_DRIVER === 'turnstile') {
      for (const key of ['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET'] as const) {
        if (!data[key]) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'Required when CAPTCHA_DRIVER is "turnstile".',
          });
        }
      }
    }
  });

export type CaptchaEnv = z.output<typeof CaptchaEnvSchema>;
