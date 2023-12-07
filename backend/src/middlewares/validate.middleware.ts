import httpStatus from "http-status";
import ApiError from "utils/ApiError";
import { NextFunction, Request, Response } from "express";
import pick from "utils/pick";
import Joi from "joi";
import * as fs from "fs";

export interface ValidationSchema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

type File = Express.Multer.File;

const extractRequestFiles = (req: Request): File[] => {
  const files: File[] = [];

  if (req.file) {
    files.push(req.file);
  }

  if (req.files) {
    files.push(...Object.values(req.files).flat());
  }

  return files;
};

const handleFileError = (req: Request) => {
  const files = extractRequestFiles(req);
  files.forEach((file) => {
    // TODO Use logger
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error(`Error deleting tmp file: ${file.path}: ${err}`);
      }
    });
  });
};

const validate =
  (schema: ValidationSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const obj = pick(req, Object.keys(validSchema) as (keyof Request)[]);

    const { value, error } = Joi.object(validSchema)
      .prefs({ errors: { label: "key" }, abortEarly: false })
      .validate(obj, {
        context: req,
      });
    if (error) {
      handleFileError(req);
      const errorMessage = error.details
        .map((details) => details.message)
        .join(", ");
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }
    Object.assign(req, value);
    return next();
  };

export default validate;
