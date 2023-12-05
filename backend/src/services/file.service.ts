import prisma from "../client";
import { File, Prisma } from "@prisma/client";
import config from "@/config";
import fs from "fs";
import { ulid } from "@/utils/ulid";
import ApiError from "@/utils/ApiError";
import path from "path";
import fse from "fs-extra";
import httpStatus from "http-status";
import { extractKeyFromFieldName } from "@/utils/form";
import { randomUUID } from "crypto";

type RequestFile = Express.Multer.File;
type RequestFiles = { [field: string]: RequestFile[] } | RequestFile[];

const defaultSelectKeys: (keyof Prisma.FileSelect)[] = [
  "id",
  "name",
  "originalName",
  "field",
  "type",
  "size",
  "accessLevel",
  "createdAt",
];

const mapFields = (
  file: RequestFile,
  name?: string,
  field?: string,
  accessLevel?: string,
): Prisma.FileCreateInput => {
  return {
    id: ulid(),
    type: file.mimetype,
    originalName: name ?? file.originalname,
    name: file.filename,
    size: file.size,
    field: extractKeyFromFieldName(field ?? file.fieldname),
    storageLocation: config.storage.location,
    accessLevel,
  };
};

const mapFileData = (requestFiles: RequestFiles): Prisma.FileCreateInput[] => {
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
    .forEach((file) => moveFile(file));
};

const moveFile = async (file: RequestFile) => {
  const sourcePath = file.path;

  const storage = getStorage();
  // TODO Do I need to wait? Can this be done in a job? What are the fail-safe mechanisms?
  await storage.moveToStorage(sourcePath, file.filename);
};

const saveRegistrationFiles = async (id: string, files: RequestFiles) => {
  // TODO Remove or move to registration service
  const fileData: Prisma.FileCreateInput[] = mapFileData(files);

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

const saveModelFile = async (
  modelName: string,
  modelId: string,
  file: RequestFile,
  name: string,
  field: string,
  accessLevel: string,
) => {
  const fileName = name + "." + file.filename.split(".").pop();
  const fileData = mapFields(file, fileName, field, accessLevel);

  const data = await prisma.file.create({
    data: {
      ...fileData,
      [`${modelName}Id`]: modelId,
    },
  });
  await moveFile(file);

  return data;
};

const getModelFile = async (modelName: string, modelId: string, id: string) => {
  return prisma.file.findFirst({
    where: {
      id,
      [`${modelName}Id`]: modelId,
    },
  });
};

const queryModelFiles = async <Key extends keyof File>(
  modelName: string,
  modelId: string,
  filter: {
    name?: string;
    type?: string;
  },
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = defaultSelectKeys as Key[],
) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? "name";
  const sortType = options.sortType ?? "desc";

  const select = keys.reduce((obj, k) => ({ ...obj, [k]: true }), {});
  const where: Prisma.FileWhereInput = {
    name: filter.name
      ? {
          startsWith: `_${filter.name}_`,
        }
      : undefined,
    type: filter.type,
    [`${modelName}Id`]: modelId,
  };

  return prisma.file.findMany({
    select,
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });
};

const getFileStream = async (file: File) => {
  const storage = getStorage(file.storageLocation);
  return storage.stream(file);
};

const deleteFile = async (id: string) => {
  const file = await prisma.file.delete({
    where: {
      id,
    },
  });

  const storage = getStorage(file.storageLocation);
  // TODO Can this be done in a job?
  await storage.remove(file);

  return file;
};
const generateFileName = (originalName: string): string => {
  const fileName = randomUUID();
  const fileExtension = originalName.split(".").pop();

  return `${fileName}.${fileExtension}`;
};

const deleteUnreferencedFiles = async () => {
  const { uploadDir, location } = config.storage;

  if (location !== "local") {
    return;
  }

  const fileNames = await fse.readdir(uploadDir);
  const fileModels = await prisma.file.findMany({
    where: {
      storageLocation: "local",
    },
    select: {
      name: true,
    },
  });

  const fileModelNames = fileModels.map((value) => value.name);
  const filesToDelete = fileNames.filter((fileName) =>
    fileModelNames.includes(fileName),
  );

  await Promise.all(
    filesToDelete.map((fileName) => {
      const filePath = path.join(uploadDir, fileName);
      return fse.unlink(filePath);
    }),
  );
};

const deleteTempFiles = async () => {
  const { tmpDir } = config.storage;

  const fileNames = await fse.readdir(tmpDir);
  const currentTime = Date.now();

  await Promise.all(
    fileNames.map((fileName) => {
      const filePath = path.join(tmpDir, fileName);
      return deleteOldFiles(filePath, currentTime);
    }),
  );
};

const deleteOldFiles = async (filePath: string, currentTime: number) => {
  const stats = await fse.stat(filePath);
  const modificationTime = stats.mtime.getTime();

  const timeDifference = currentTime - modificationTime;
  const oneHourInMilliseconds = 60 * 60 * 1000; // One hour in milliseconds

  if (timeDifference > oneHourInMilliseconds) {
    await fse.unlink(filePath);
  }
};

// Generic storage
interface StorageStrategy {
  remove: (file: File) => Promise<void>;
  moveToStorage: (sourcePath: string, filename: string) => Promise<void>;
  stream: (file: File) => fs.ReadStream;
}

const getStorage = (name?: string): StorageStrategy => {
  if (name === undefined) {
    name = config.storage.location;
  }

  if (name === "local") {
    return LocalStorage;
  }

  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    `Unknown storage strategy ${name}`,
  );
};

const LocalStorage: StorageStrategy = {
  remove: async (file: File) => {
    const filePath = path.join(config.storage.uploadDir, file.name);
    return fse.remove(filePath);
  },
  moveToStorage: async (sourcePath: string, filename: string) => {
    const destinationDir = config.storage.uploadDir;
    const destinationPath = path.join(destinationDir, filename);

    await fse.ensureDir(destinationDir);
    await fse.move(sourcePath, destinationPath, {
      overwrite: false,
    });
  },
  stream: (file: File) => {
    const filePath = path.join(config.storage.uploadDir, file.name);
    if (!fse.existsSync(filePath)) {
      throw new ApiError(httpStatus.NOT_FOUND, "File is missing in storage.");
    }

    return fse.createReadStream(filePath);
  },
};

export default {
  saveRegistrationFiles,
  saveModelFile,
  getModelFile,
  getFileStream,
  queryModelFiles,
  deleteFile,
  generateFileName,
  deleteUnreferencedFiles,
  deleteTempFiles,
};
