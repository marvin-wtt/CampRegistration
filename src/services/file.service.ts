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
  "field",
  "type",
];

const mapFileData = (
  requestFiles: RequestFiles,
  accessLevel = "private"
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
      accessLevel,
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
  // TODO Remove or move to registration service
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

const  saveModelFiles = async (modelName: string, modelId: string, files: RequestFiles, accessLevel = 'private') => {
  const fileData = mapFileData(files, accessLevel).map((fileData) => {
    return {
      ...fileData,
      [`${modelName}Id`]: modelId,
    };
  });

  const fileModes = await prisma.$transaction(
    fileData.map((file) => prisma.file.create({ data: file })),
  );

  moveFiles(files);

  return fileModes;
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

const getModelFileByName = async (
  modelName: "camp" | "registration",
  modelId: string,
  name: string
) => {
  return prisma.file.findFirst({
    where: {
      name,
      [`${modelName}Id`]: modelId,
    },
    include: {
      camp: true,
      registration: true,
    },
  });
};

const getModelFile = async (
  modelName: string,
  modelId: string,
  id: string
) => {
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

  const where: Prisma.FileWhereInput = {
    name: {
      startsWith: `_${filter.name}_`,
    },
    type: filter.type,
  }

  return prisma.file.findMany({
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    where: {
      [`${modelName}Id`]: modelId,
      ...where
    },
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
      id
    }
  });
}

export default {
  saveRegistrationFiles,
  saveModelFiles,
  getFileByName,
  getModelFile,
  getModelFileByName,
  getFileStream,
  queryModelFiles,
  deleteFile,
};
