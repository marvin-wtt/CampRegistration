import { env } from '#config/enviroment';

export default {
  secret: env.JWT_SECRET,
  accessExpirationMinutes: env.TOKEN_EXPIRATION_ACCESS,
  refreshExpirationDays: env.TOKEN_EXPIRATION_REFRESH,
  resetPasswordExpirationMinutes: env.TOKEN_EXPIRATION_RESET_PASSWORD,
  verifyEmailExpirationMinutes: env.TOKEN_EXPIRATION_VERIFY_EMAIL,
};
