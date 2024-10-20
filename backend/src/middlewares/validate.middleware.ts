import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { Request } from 'express';
import pick from 'utils/pick';
import Joi from 'joi';
import fileService from 'app/file/file.service';
import logger from 'config/logger';
import { catchMiddlewareAsync } from 'utils/catchAsync';

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
    fileService.deleteTempFile(file.filename).catch((reason) => {
      logger.error(`Failed to delete tmp file: ${file.filename}: ${reason}`);
    });
  });
};

const validate = (schema: ValidationSchema) =>
  catchMiddlewareAsync((req: Request) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const obj = pick(req, Object.keys(validSchema) as (keyof Request)[]);

    const { value, error } = Joi.object(validSchema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(obj, {
        context: req,
      });
    if (error) {
      handleFileError(req);
      const errorMessage = error.details
        .map((details) => details.message)
        .join(', ');
      throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
    }
    Object.assign(req, value);
  });

export default validate;
