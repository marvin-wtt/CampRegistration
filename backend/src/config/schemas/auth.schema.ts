import { z } from 'zod';

export const AuthEnvSchema = z.object({
  JWT_SECRET: z.string().describe('JWT secret key').readonly(),
  TOTP_RECOVERY_CODE_SECRET: z
    .string()
    .describe('HMAC key for hashing two-factor recovery codes')
    .readonly(),
  TOKEN_EXPIRATION_ACCESS: z.coerce
    .number()
    .int()
    .positive()
    .describe('Time in minutes until access token expires')
    .default(30),
  TOKEN_EXPIRATION_REFRESH: z.coerce
    .number()
    .int()
    .positive()
    .describe('Time in days until refresh token expires')
    .default(30),
  TOKEN_EXPIRATION_RESET_PASSWORD: z.coerce
    .number()
    .int()
    .positive()
    .describe('Time in minutes until password reset token expires')
    .default(10),
  TOKEN_EXPIRATION_VERIFY_EMAIL: z.coerce
    .number()
    .int()
    .positive()
    .describe('Time in minutes until email verification token expires')
    .default(10),
  WEBAUTHN_RP_ID: z
    .string()
    .optional()
    .describe(
      'WebAuthn relying party ID that passkeys are bound to. Defaults to the ' +
        'APP_URL hostname. Changing it invalidates every registered passkey.',
    ),
  WEBAUTHN_RP_NAME: z
    .string()
    .optional()
    .describe(
      'Relying party name shown in passkey prompts. Defaults to APP_NAME.',
    ),
  WEBAUTHN_ORIGINS: z
    .string()
    .optional()
    .describe(
      'Comma-separated list of origins passkey ceremonies may come from. ' +
        'Defaults to the APP_URL origin; set it when the frontend is served ' +
        'elsewhere, such as the dev server.',
    )
    .meta({ examples: ['http://localhost:9000'] }),
});

export type AuthEnv = z.output<typeof AuthEnvSchema>;
