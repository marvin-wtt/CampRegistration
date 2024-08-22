import prisma from '../client';
import { File, Prisma } from '@prisma/client';
import config from 'config';
import fs from 'fs';
import { ulid } from 'utils/ulid';
import ApiError from 'utils/ApiError';
import path from 'path';
import fse from 'fs-extra';
import httpStatus from 'http-status';
import { extractKeyFromFieldName } from 'utils/form';
import { decodeTime, isValid } from 'ulidx';
import moment from 'moment';
import logger from 'config/logger';

type RequestFile = Express.Multer.File;

interface ModelData {
  id: string;
  name: string;
}

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

const moveFile = async (file: RequestFile) => {
  const sourcePath = file.path;

  const storage = getStorage();
  // TODO Do I need to wait? Can this be done in a job? What are the fail-safe mechanisms?
  await storage.moveToStorage(sourcePath, file.filename);
};

const saveModelFile = async (
  model: ModelData | undefined,
  file: RequestFile,
  name?: string | undefined,
  field?: string | undefined,
  accessLevel?: string | undefined,
) => {
  const fileName = name + '.' + file.filename.split('.').pop();
  const fileData = mapFields(file, fileName, field, accessLevel);
  const modelData = model ? { [`${model.name}Id`]: model.id } : {};

  // Move file first to ensure that they really exist
  await moveFile(file);

  return prisma.file.create({
    data: {
      ...fileData,
      ...modelData,
    },
  });
};

const getModelFile = async (modelName: string, modelId: string, id: string) => {
  return prisma.file.findFirst({
    where: {
      id,
      [`${modelName}Id`]: modelId,
    },
  });
};

const queryModelFiles = async (
  model: ModelData,
  filter: {
    name?: string;
    type?: string;
  } = {},
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  } = {},
) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'name';
  const sortType = options.sortType ?? 'desc';

  const where: Prisma.FileWhereInput = {
    name: filter.name
      ? {
          startsWith: `_${filter.name}_`,
        }
      : undefined,
    type: filter.type,
    [`${model.name}Id`]: model.id,
  };

  return prisma.file.findMany({
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
  try {
    await storage.remove(file);
  } catch (e) {
    // Do not throw an error because the operation seems successfully to the user anyway
    logger.error(`Error while deleting file: ${file.name}.`);
    logger.error(e);
  }

  return file;
};

const deleteTempFile = async (fileName: string) => {
  const filePath = path.join(config.storage.tmpDir, fileName);
  return fse.remove(filePath);
};

const generateFileName = (originalName: string): string => {
  const fileName = ulid();
  const fileExtension = originalName.split('.').pop();

  return `${fileName}.${fileExtension}`;
};

const deleteUnreferencedFiles = async (): Promise<number> => {
  const { uploadDir, location } = config.storage;

  if (location !== 'local') {
    return 0;
  }

  const fileNames = await fse.readdir(uploadDir);
  const fileModels = await prisma.file.findMany({
    where: {
      storageLocation: 'local',
    },
    select: {
      name: true,
    },
  });

  const fileModelNames = fileModels.map((value) => value.name);
  const filesToDelete = fileNames.filter(
    (fileName) => !fileModelNames.includes(fileName),
  );

  await Promise.all(
    filesToDelete.map((fileName) => {
      const filePath = path.join(uploadDir, fileName);
      return fse.unlink(filePath);
    }),
  );

  return filesToDelete.length;
};

const deleteUnassignedFiles = async (): Promise<number> => {
  const minAge = moment().subtract('1', 'd').toDate();
  const files = await prisma.file.findMany({
    where: {
      campId: null,
      registrationId: null,
      createdAt: { lt: minAge },
    },
  });

  // Delete files from database first so that the files can no longer be accessed.
  const fileIds = files.map((file) => file.id);
  const result = await prisma.file.deleteMany({
    where: { id: { in: fileIds } },
  });

  const fileDeletions = files.map((file) => {
    const storage = getStorage(file.storageLocation);
    return storage.remove(file);
  });

  await Promise.all(fileDeletions);

  return result.count;
};

const deleteTempFiles = async () => {
  const { tmpDir } = config.storage;

  const fileNames = await fse.readdir(tmpDir);
  const currentTime = Date.now();

  const getFileCreationTime = (fileName: string) => {
    const id = fileName.split('.')[0];

    return isValid(id) ? decodeTime(id) : 0;
  };

  const isOlderThanOneHour = (fileName: string): boolean => {
    const time = getFileCreationTime(fileName);
    const timeDifference = currentTime - time;
    const oneHourInMilliseconds = 60 * 60 * 1000;

    return timeDifference > oneHourInMilliseconds;
  };

  const results = await Promise.all(
    fileNames.filter(isOlderThanOneHour).map((fileName) => {
      const filePath = path.join(tmpDir, fileName);
      return fse.unlink(filePath);
    }),
  );

  return results.length;
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

  if (name === 'local') {
    return LocalStorage;
  }

  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    `Unknown storage strategy ${name}`,
  );
};

const LocalStorage: StorageStrategy = {
  remove: async (file: File) => {
    const { uploadDir } = config.storage;
    const filePath = path.join(uploadDir, file.name);

    verifyDirectoryPath(filePath, uploadDir);

    await fse.remove(filePath);
  },
  moveToStorage: async (sourcePath: string, filename: string) => {
    const { uploadDir, tmpDir } = config.storage;
    const destinationPath = path.join(uploadDir, filename);

    verifyDirectoryPath(destinationPath, uploadDir);
    verifyDirectoryPath(sourcePath, tmpDir);

    await fse.ensureDir(uploadDir);
    await fse.move(sourcePath, destinationPath, {
      overwrite: false,
    });
  },
  stream: (file: File) => {
    const { uploadDir } = config.storage;
    const filePath = path.join(uploadDir, file.name);

    verifyDirectoryPath(filePath, uploadDir);

    if (!fse.existsSync(filePath)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'File is missing in storage.');
    }

    return fse.createReadStream(filePath);
  },
};

const verifyDirectoryPath = (filePath: string, rootPath: string) => {
  // Make sure, that the file path does not escape the root path
  const resolvedFilePath = path.resolve(filePath);
  const resolvedRootPath = path.resolve(rootPath);

  if (!resolvedFilePath.startsWith(resolvedRootPath)) {
    throw new ApiError(403, 'Invalid file data');
  }
};

export default {
  saveModelFile,
  getModelFile,
  getFileStream,
  queryModelFiles,
  deleteFile,
  deleteTempFile,
  generateFileName,
  deleteUnreferencedFiles,
  deleteUnassignedFiles,
  deleteTempFiles,
};
