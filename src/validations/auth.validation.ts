import Joi from "joi";
import passwordComplexity from "joi-password-complexity";

const passwordComplexityOptions = {
  min: 8,
  symbol: 1,
  numeric: 1,
};

const register = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    password: passwordComplexity(passwordComplexityOptions),
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
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: passwordComplexity(passwordComplexityOptions),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
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
