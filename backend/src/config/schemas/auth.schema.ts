import { z } from 'zod/v4';

export const AuthEnvSchema = z.object({
  JWT_SECRET: z.string().describe('JWT secret key').readonly(),
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
});
