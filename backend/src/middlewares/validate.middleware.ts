import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, z, ZodError } from 'zod';
import { fromError } from 'zod-validation-error';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import fileService from '#app/file/file.service.js';
import logger from '#core/logger.js';

const validate = (req: Request, _res: Response, next: NextFunction) => {
  req.validate = (schema) => validateRequest(req, schema);
  next();
};

export async function validateRequest<T extends AnyZodObject>(
  req: Request,
  schema: T,
): Promise<Readonly<z.infer<T>>> {
  try {
    // It is important to await here to catch the error
    return await schema.readonly().parseAsync(req);
  } catch (err) {
    handleFileError(req);

    if (err instanceof ZodError) {
      const validationError = fromError(err);

      throw new ApiError(httpStatus.BAD_REQUEST, validationError.toString());
    }

    throw err;
  }
}

const handleFileError = (req: Request) => {
  const files = extractRequestFiles(req);
  files.forEach((file) => {
    fileService.deleteTempFile(file.filename).catch((reason) => {
      logger.error(`Failed to delete tmp file: ${file.filename}: ${reason}`);
    });
  });
};

const extractRequestFiles = (req: Request): Express.Multer.File[] => {
  const files: Express.Multer.File[] = [];

  if (req.file) {
    files.push(req.file);
  }

  if (req.files) {
    files.push(...Object.values(req.files).flat());
  }

  return files;
};

export default validate;
