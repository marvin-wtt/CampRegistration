import Joi from "joi";

export const password: Joi.CustomValidator<string> = (value, helpers) => {
  if (value.length < 8) {
    return helpers.error("string.min");
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message({
      en: "Password must contain at least one letter and one number."
    });
  }
  return value;
};
