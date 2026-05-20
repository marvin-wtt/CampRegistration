import multer, { type Field } from 'multer';
import config from '#config/index';
import type { NextFunction, Request, Response } from 'express';
import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';
import { fileTypeFromFile } from 'file-type';
import { remove } from 'fs-extra';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import logger from '#core/logger';

type ParameterType = string | Field | readonly Field[] | null | undefined;

// Types that browsers may execute or interpret as active content
const BLOCKED_MIME_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/javascript',
  'text/javascript',
  'application/x-httpd-php',
  'application/x-sh',
  'application/x-executable',
  'application/x-msdownload',
  'application/x-dosexec',
]);

const getAllFiles = (req: Request): Express.Multer.File[] => {
  if (req.file) {
    return [req.file];
  }
  if (!req.files) {
    return [];
  }
  return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
};

const multiPart = (fields: ParameterType) => {
  // Chain upload with formatter
  return async (req: Request, res: Response, next: NextFunction) => {
    await upload(fields)(req, res, (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      formatterMiddleware(req, res, next).catch(next);
    });
  };
};

const upload = (fields: ParameterType) => {
  const fileService = resolve(FileService);
  const tmpDir = config.storage.tmpDir;

  const tmpStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, tmpDir);
    },
    filename: (_req, file, cb) => {
      const fileName = fileService.generateFileName(file.originalname);
      cb(null, fileName);
    },
  });

  // TODO Add file filter to check if the disk has enough space with a threshold before upload
  const upload = multer({
    storage: tmpStorage,
    limits: {
      fileSize: config.storage.maxFileSize,
    },
  });

  return resolveMulterMiddleware(upload, fields);
};

const resolveMulterMiddleware = (
  upload: multer.Multer,
  fields: ParameterType,
) => {
  if (fields === null) {
    return upload.none();
  }

  if (fields === undefined) {
    return upload.any();
  }

  if (typeof fields === 'string') {
    return upload.single(fields);
  }

  if (Array.isArray(fields)) {
    return upload.fields(fields);
  }

  // TODO Why do I need to cast here?
  const field = fields as Field;
  return upload.array(field.name, field.maxCount);
};

const formatterMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // Convert null prototypes to objects
  // TODO Why do I need to do this? This seems to be a bug but I cant find out why...
  req.body = removePrototype(req.body) as unknown;

  const files = getAllFiles(req);

  for (const file of files) {
    const detected = await fileTypeFromFile(file.path);
    // Fall back to application/octet-stream for types without magic bytes (e.g. plain text, CSV).
    // This is safe: browsers download rather than execute octet-stream responses.
    const mime = detected?.mime ?? 'application/octet-stream';

    if (BLOCKED_MIME_TYPES.has(mime)) {
      await Promise.all(
        files.map((f) =>
          remove(f.path).catch((e: unknown) => {
            logger.warn('Failed to remove tmp file', e);
          }),
        ),
      );
      next(
        new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'File type not allowed'),
      );
      return;
    }

    file.mimetype = mime;
  }

  next();
};

const removePrototype = <T>(obj: T): T => {
  // TODO How to improve? Maybe use parser? Or should only a null object be used?
  return JSON.parse(JSON.stringify(obj)) as T;
};

export default multiPart;
