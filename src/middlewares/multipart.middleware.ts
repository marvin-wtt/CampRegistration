import multer, { Field } from "multer";
import config from "@/config";
import fs from "fs";
import { NextFunction, Request, Response } from "express";
import dynamicMiddleware from "@/middlewares/dynamic.middleware";
import {randomUUID} from "crypto";

type ParameterType = string | Field | ReadonlyArray<Field> | null | undefined;
type FileFormat = Record<string, Express.Multer.File[]>;

const multiPart = (fields: ParameterType) => {
  return dynamicMiddleware([upload(fields), formatterMiddleware]);
};

const upload = (fields: ParameterType) => {
  const tmpDir = config.storage.tmpDir;

  const tmpStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
      const fileName = randomUUID();
      const fileExtension = file.originalname.split(".").pop();
      cb(null, `${fileName}.${fileExtension}`);
    },
  });

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const upload = multer({
    storage: tmpStorage,
    limits: {
      fileSize: 100e6,
    },
  });

  return resolveMulterMiddleware(upload, fields);
};

const resolveMulterMiddleware = (
  upload: multer.Multer,
  fields: ParameterType
) => {
  if (fields === null) {
    return upload.none();
  }

  if (fields === undefined) {
    return upload.any();
  }

  if (typeof fields === "string") {
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
  res: Response,
  next: NextFunction
) => {
  // Convert null prototypes to objects
  // TODO Why do I need to do this? This seems to be a bug but I cant find out why...
  req.body = removePrototype(req.body);

  // Format files so that they are always grouped by the field name
  req.files = Array.isArray(req.files)
    ? formatFileArray(req.files)
    : typeof req.files === "object"
    ? formatFileGroup(req.files)
    : req.files;

  next();
};

const removePrototype = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  const newObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = removePrototype(obj[key]);
    }
  }

  return newObj;
};

const formatFieldName = (name: string): string => {
  // Remove brackets if they exist
  return name.replace(/\[]$/, "");
};

const formatFileArray = (files: Express.Multer.File[]): FileFormat => {
  const groupedFiles: FileFormat = {};
  files.forEach((file) => {
    const fieldName = formatFieldName(file.fieldname);
    file.fieldname = fieldName;
    // Group files by field name
    if (!groupedFiles[fieldName]) {
      groupedFiles[fieldName] = [];
    }
    groupedFiles[fieldName].push(file);
  });

  return groupedFiles;
};

const formatFileGroup = (filesObject: FileFormat): FileFormat => {
  return Object.keys(filesObject).reduce((acc, key) => {
    const files = filesObject[key];
    acc[key] = files.map((file: Express.Multer.File) => {
      file.fieldname = formatFieldName(file.fieldname);
      return file;
    });
    return acc;
  }, {} as FileFormat);
};

export default multiPart;
