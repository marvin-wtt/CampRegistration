import { z } from 'zod';
import { validateEnv } from 'core/validation/env';

export const AuthEnvSchema = z
  .object({
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
  })
  .readonly();

const envVars = validateEnv(AuthEnvSchema);

export default {
  secret: envVars.JWT_SECRET,
  accessExpirationMinutes: envVars.TOKEN_EXPIRATION_ACCESS,
  refreshExpirationDays: envVars.TOKEN_EXPIRATION_REFRESH,
  resetPasswordExpirationMinutes: envVars.TOKEN_EXPIRATION_RESET_PASSWORD,
  verifyEmailExpirationMinutes: envVars.TOKEN_EXPIRATION_VERIFY_EMAIL,
};
