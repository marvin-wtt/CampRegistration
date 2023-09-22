import prisma from "../client";
import { File, Prisma } from "@prisma/client";
import config from "@/config";
import fs from "fs";
import { ulid } from "@/utils/ulid";
import ApiError from "@/utils/ApiError";
import path from "path";

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
  accessLevel?: string
): Prisma.FileCreateInput => {
  return {
    id: ulid(),
    type: file.mimetype,
    originalName: name ?? file.originalname,
    name: file.filename,
    size: file.size,
    field: field ?? file.fieldname,
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

const moveFile = (file: RequestFile) => {
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
  accessLevel: string
) => {
  const fileName = name + '.' + file.filename.split(".").pop();
  const fileData = mapFields(file, fileName, field, accessLevel);

  const data = await prisma.file.create({
    data: {
      ...fileData,
      [`${modelName}Id`]: modelId,
    },
  });
  moveFile(file);

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
  keys: Key[] = defaultSelectKeys as Key[]
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
  if (file.storageLocation === "local") {
    const filePath = path.join(config.storage.uploadDir, file.name);
    return fs.createReadStream(filePath);
  }

  throw new ApiError(400, "Unknown storage type");
};

const deleteFile = async (id: string) => {
  return prisma.file.delete({
    where: {
      id,
    },
  });
};

export default {
  saveRegistrationFiles,
  saveModelFile,
  getModelFile,
  getFileStream,
  queryModelFiles,
  deleteFile,
};
