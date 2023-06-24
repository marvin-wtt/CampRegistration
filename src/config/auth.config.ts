import Joi from "joi";

const { value: envVars, error } = Joi.object()
  .keys({
    JWT_SECRET: Joi.string().required().description("JWT secret key"),
  })
  .unknown()
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  secret: envVars.JWT_SECRET,
  accessExpirationMinutes: 2,
  refreshExpirationDays: 30,
  resetPasswordExpirationMinutes: 10,
  verifyEmailExpirationMinutes: 10,
};
