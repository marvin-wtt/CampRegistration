import type { Request } from 'express';
import { type ZodObject, type z, ZodError } from 'zod';
import { fromError } from 'zod-validation-error';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { FileService } from '#app/file/file.service';
import logger from '#core/logger';
import { resolve } from '#core/ioc/container.js';

export async function validateRequest<T extends ZodObject>(
  req: Request,
  schema: T,
): Promise<Readonly<z.infer<T>>> {
  try {
    // It is important to await here to catch the error
    return (await schema.readonly().parseAsync(req)) as Readonly<z.infer<T>>;
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
  const fileService = resolve(FileService);

  // TODO Maybe await the promise
  files.forEach((file) => {
    fileService.deleteTempFile(file.filename).catch((reason: unknown) => {
      logger.error(
        `Failed to delete tmp file: ${file.filename}: ${String(reason)}`,
      );
    });
  });
};

const extractRequestFiles = (req: Request): Express.Multer.File[] => {
  const files: Express.Multer.File[] = [];

  if (req.file) {
    files.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      files.push(...Object.values(req.files).flat());
    }
  }

  return files;
};
