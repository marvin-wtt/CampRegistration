import prisma from "../client";
import { Prisma } from "@prisma/client";
import config from "@/config";
import fs from "fs";
import { ulid } from "@/utils/ulid";

type File = Express.Multer.File;

type RequestFiles = { [field: string]: File[] } | File[];

const mapFileData = (requestFiles: RequestFiles): Prisma.FileCreateInput[] => {
  const mapFields = (file: File, fieldName?: string) => {
    return {
      id: ulid(),
      type: file.mimetype,
      originalName: file.originalname,
      name: file.filename,
      size: file.size,
      field: fieldName ?? file.fieldname,
    };
  };

  // Array of files
  if (Array.isArray(requestFiles)) {
    return requestFiles.map((file) => mapFields(file));
  }

  // Object of files
  const fileData: Prisma.FileCreateInput[] = [];
  for (const [field, files] of Object.entries(requestFiles)) {
    files.forEach((file) => {
      fileData.push(mapFields(file, field));
    });
  }

  return fileData;
};

const moveFiles = (files: RequestFiles) => {
  Object.values(files)
    .flat()
    .forEach((file) => {
      const sourcePath = file.path;
      const destinationDir = config.storage.uploadDir;
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir);
      }
      const destinationPath = destinationDir + file.filename;
      fs.rename(sourcePath, destinationPath, (err) => {
        if (err) {
          console.error(
            `Error moving file: ${sourcePath} to ${destinationPath}: ${err}`
          );
        }
      });
    });
};

const saveRegistrationFiles = async (id: string, files: RequestFiles) => {
  const fileData: Prisma.FileCreateInput[] = mapFileData(files).map(
    (fileData) => {
      return {
        ...fileData,
        registrationId: id,
      };
    }
  );

  const fileModes = await prisma.file.createMany({
    data: fileData,
  });

  moveFiles(files);

  return fileModes;
};

const saveCampFiles = async (id: string, files: RequestFiles) => {
  const fileData = mapFileData(files).map((fileData) => {
    return {
      ...fileData,
      campId: id,
    };
  });

  const fileModes = await prisma.file.createMany({
    data: fileData,
  });

  moveFiles(files);

  return fileModes;
};

export default {
  saveRegistrationFiles,
  saveCampFiles,
};
