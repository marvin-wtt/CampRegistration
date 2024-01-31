import Joi from 'joi';

const { value: envVars, error } = Joi.object()
  .keys({
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_SECURE: Joi.boolean().description(
      'encrypt the connection to the server',
    ),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description(
      'the from field in the emails sent by the app',
    ),
    EMAIL_REPLY_TO: Joi.string().description(
      'the replyTo field in the emails sent by the app',
    ),
    EMAIL_ADMIN: Joi.string().description(
      'email to send operational notifications to',
    ),
  })
  .unknown()
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    secure: envVars.SMTP_SECURE,
    auth: {
      user: envVars.SMTP_USERNAME,
      pass: envVars.SMTP_PASSWORD,
    },
  },
  from: envVars.EMAIL_FROM,
  replyTo: envVars.EMAIL_REPLY_TO,
  admin: envVars.EMAIL_ADMIN,
};
