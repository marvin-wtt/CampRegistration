import prisma from "../client";
import { File, Prisma } from "@prisma/client";
import config from "@/config";
import fs from "fs";
import { ulid } from "@/utils/ulid";
import ApiError from "@/utils/ApiError";
import path from "path";

type RequestFile = Express.Multer.File;

type RequestFiles = { [field: string]: RequestFile[] } | RequestFile[];

const mapFileData = (
  requestFiles: RequestFiles,
  visibility = "private"
): Prisma.FileCreateInput[] => {
  const mapFields = (
    file: RequestFile,
    fieldName?: string
  ): Prisma.FileCreateInput => {
    return {
      id: ulid(),
      type: file.mimetype,
      originalName: file.originalname,
      name: file.filename,
      size: file.size,
      field: fieldName ?? file.fieldname,
      storageLocation: config.storage.location,
      visibility,
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
      const destinationPath = path.join(destinationDir, file.filename);
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
  const fileData: Prisma.FileCreateInput[] = mapFileData(files, "private");

  const registration = await prisma.registration.update({
    where: {
      id: id,
    },
    data: {
      files: {
        createMany: {
          data: fileData,
        },
      },
    },
    include: {
      files: true,
    },
  });

  moveFiles(files);

  return registration;
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

const getCampFileByName = async (name: string, id: string) => {
  return prisma.file.findFirst({
    where: {
      name,
      campId: id,
    },
  });
};

const getRegistrationFileByName = async (name: string, id: string) => {
  return prisma.file.findFirst({
    where: {
      name,
      registrationId: id,
    },
  });
};

const getFileByName = async (name: string) => {
  return prisma.file.findFirst({
    where: {
      name,
    },
    include: {
      camp: true,
    },
  });
};

const getFileStream = async (file: File) => {
  if (file.storageLocation === "local") {
    const filePath = path.join(config.storage.uploadDir, file.name);
    return fs.createReadStream(filePath);
  }

  throw new ApiError(400, "Unknown storage type");
};

export default {
  saveRegistrationFiles,
  saveCampFiles,
  getFileByName,
  getCampFileByName,
  getRegistrationFileByName,
  getFileStream,
};
