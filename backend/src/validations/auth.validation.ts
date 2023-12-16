import Joi from 'joi';
import { PasswordSchema } from './custom.validation';

const register = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    password: PasswordSchema,
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    remember: Joi.boolean().default(false),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    email: Joi.string().email().required(),
    password: PasswordSchema,
  }),
};

const verifyEmail = {
  body: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export default {
  register,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
