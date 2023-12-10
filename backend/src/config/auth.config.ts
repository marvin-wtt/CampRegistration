import Joi from "joi";

const { value: envVars, error } = Joi.object()
  .keys({
    JWT_SECRET: Joi.string().required().description("JWT secret key"),
    TOKEN_EXPIRATION_ACCESS: Joi.number()
      .integer()
      .positive()
      .description("Time in minutes until access token expires"),
    TOKEN_EXPIRATION_REFRESH: Joi.number()
      .integer()
      .positive()
      .description("Time in days until refresh token expires"),
    TOKEN_EXPIRATION_RESET_PASSWORD: Joi.number()
      .integer()
      .positive()
      .description("Time in minutes until password reset token expires"),
    TOKEN_EXPIRATION_VERIFY_EMAIL: Joi.number()
      .integer()
      .positive()
      .description("Time in minutes until email verification token expires"),
  })
  .unknown()
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  secret: envVars.JWT_SECRET,
  accessExpirationMinutes: envVars.TOKEN_EXPIRATION_ACCESS ?? 30,
  refreshExpirationDays: envVars.TOKEN_EXPIRATION_REFRESH ?? 30,
  resetPasswordExpirationMinutes: envVars.TOKEN_EXPIRATION_RESET_PASSWORD ?? 10,
  verifyEmailExpirationMinutes: envVars.TOKEN_EXPIRATION_VERIFY_EMAIL ?? 10,
};
