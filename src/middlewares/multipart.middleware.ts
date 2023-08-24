import multer from "multer";
import { ulid } from "@/utils/ulid";
import config from "@/config";
import fs from "fs";
import { NextFunction, Request, Response } from "express";

type FileFormat = Record<string, Express.Multer.File[]>;

const multiPart = (req: Request, res: Response, next: NextFunction) => {
  upload()(req, res, (param: unknown) => {
    if (param) {
      next(param);
      return;
    }

    // Convert bull prototypes to objects
    req.body = removePrototype(req.body);

    // Format files so that they are always grouped by the field name
    req.files = req.file
      ? formatFile(req.file)
      : Array.isArray(req.files)
      ? formatFileArray(req.files)
      : typeof req.files === "object"
      ? formatFileGroup(req.files)
      : req.files;
    req.file = undefined;

    next();
  });
};

const upload = () => {
  const tmpDir = config.storage.tmpDir;

  const tmpStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
      const fileName = ulid();
      const fileExtension = file.originalname.split(".").pop();
      cb(null, `${fileName}.${fileExtension}`);
    },
  });

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const upload = multer({
    storage: tmpStorage,
  });

  return upload.any();
};

const removePrototype = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const newObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = removePrototype(obj[key]);
    }
  }

  return newObj;
}

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

const formatFile = (file: Express.Multer.File): FileFormat => {
  const fieldName = formatFieldName(file.fieldname);
  file.fieldname = fieldName;

  return {
    [fieldName]: [file],
  };
};

export default multiPart;
