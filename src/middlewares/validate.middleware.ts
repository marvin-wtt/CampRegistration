import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { NextFunction, Request, Response } from "express";
import pick from "../utils/pick";
import Joi from "joi";

export interface ValidationSchema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

const validate =
  (schema: ValidationSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const obj = pick(req, Object.keys(validSchema) as (keyof Request)[]);

    const { value, error } = Joi.object(validSchema)
      .prefs({ errors: { label: "key" }, abortEarly: false })
      .validate(obj);
    if (error) {
      const errorMessage = error.details
        .map((details) => details.message)
        .join(", ");
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }
    Object.assign(req, value);
    return next();
  };

export default validate;
