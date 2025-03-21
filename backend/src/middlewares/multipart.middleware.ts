import multer, { Field } from 'multer';
import config from '#config/index';
import { NextFunction, Request, Response } from 'express';
import dynamic from './dynamic.middleware.js';
import fileService from '#app/file/file.service';

type ParameterType = string | Field | ReadonlyArray<Field> | null | undefined;

const multiPart = (fields: ParameterType) => {
  return dynamic([upload(fields), formatterMiddleware]);
};

const upload = (fields: ParameterType) => {
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

const formatterMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // Convert null prototypes to objects
  // TODO Why do I need to do this? This seems to be a bug but I cant find out why...
  req.body = removePrototype(req.body);

  next();
};

const removePrototype = <T>(obj: T): T => {
  // TODO How to improve? Maybe use parser? Or should only a null object be used?
  return JSON.parse(JSON.stringify(obj));
};

export default multiPart;
