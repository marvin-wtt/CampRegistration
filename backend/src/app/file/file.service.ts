import prisma from 'client';
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

const moveFileToStorage = async (file: RequestFile) => {
  const sourcePath = file.path;

  const storage = getStorage();
  // TODO Do I need to wait? Can this be done in a job? What are the fail-safe mechanisms?
  await storage.moveToStorage(sourcePath, file.filename);
};

const saveModelFile = async (
  model: ModelData | undefined,
  file: RequestFile,
  name: string | undefined,
  field?: string | undefined,
  accessLevel?: string | undefined,
) => {
  // Move file first to ensure that they really exist
  await moveFileToStorage(file);

  const data = modelFileCreateData(model, file, name, field, accessLevel);

  return prisma.file.create({
    data,
  });
};

const modelFileCreateData = (
  model: ModelData | undefined,
  file: RequestFile,
  name?: string | undefined,
  field?: string | undefined,
  accessLevel?: string | undefined,
) => {
  const fileName = name
    ? name + '.' + file.filename.split('.').pop()
    : undefined;
  const fileData = mapFields(file, fileName, field, accessLevel);
  const modelData = model ? { [`${model.name}Id`]: model.id } : {};

  return {
    ...fileData,
    ...modelData,
  };
};

const createManyModelFile = async (
  model: ModelData | undefined,
  files: Omit<Prisma.FileCreateManyInput, 'id'>[],
) => {
  const modelData = model ? { [`${model.name}Id`]: model.id } : {};

  const data = files.map((file) => {
    return {
      ...file,
      ...modelData,
      id: ulid(),
      createdAt: undefined,
    };
  });

  return prisma.file.createMany({
    data,
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

  return prisma.file.findMany({
    where: {
      name: filter.name ? { startsWith: `_${filter.name}_` } : undefined,
      type: filter.type,
      [`${model.name}Id`]: model.id,
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });
};

const queryFilesByIds = async (fileIds: string[]) => {
  return prisma.file.findMany({
    where: {
      id: {
        in: fileIds,
      },
    },
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

  const fileCount = await prisma.file.count({
    where: {
      name: file.name,
    },
  });

  // Do not delete file from storage if other references still exist
  if (fileCount > 0) {
    return file;
  }

  // Check if other files still reference the file on the disk
  const remainingReferences = await prisma.file.count({
    where: {
      name: file.name,
    },
  });

  // Only delete the file if no further references are present
  if (remainingReferences > 0) {
    return;
  }

  const storage = getStorage(file.storageLocation);
  try {
    await storage.remove(file.name);
  } catch (e) {
    // Do not throw an error because the operation seems successfully to the user anyway
    logger.error(`Error while deleting file: ${file.name}.`);
    logger.error(e);
  }
};

const deleteTempFile = async (fileName: string) => {
  const filePath = safeJoinFilePath(config.storage.tmpDir, fileName);

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
      expenseId: null,
      createdAt: { lt: minAge },
    },
    select: {
      id: true,
      name: true,
      storageLocation: true,
    },
  });

  // Delete files from database first so that the files can no longer be accessed.
  const fileIds = files.map((file) => file.id);
  const result = await prisma.file.deleteMany({
    where: { id: { in: fileIds } },
  });

  // Check if any file is still referenced by another model
  const fileNames = files.map((file) => file.name);
  const usedFiles = await prisma.file.findMany({
    where: { name: { in: fileNames } },
    select: { name: true },
  });

  // Delete files from storage that are no longer in use
  const fileDeletions = files
    .filter((file) => !usedFiles.some((value) => value.name === file.name))
    .map((file) => {
      const storage = getStorage(file.storageLocation);

      return storage.remove(file.name);
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
  remove: (fileName: string) => Promise<void>;
  moveToStorage: (sourcePath: string, filename: string) => Promise<void>;
  stream: (file: File) => fs.ReadStream;
}

const getStorage = (name?: string): StorageStrategy => {
  if (name === undefined) {
    name = config.storage.location;
  }

  if (name === 'local') {
    return new DiskStorage(config.storage.uploadDir);
  }

  if (name === 'static') {
    return new StaticStorage();
  }

  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    `Unknown storage strategy ${name}`,
  );
};

class DiskStorage implements StorageStrategy {
  constructor(private storageDir: string) {}

  async remove(fileName: string) {
    const filePath = safeJoinFilePath(this.storageDir, fileName);

    await fse.remove(filePath);
  }

  async moveToStorage(sourcePath: string, filename: string) {
    const { tmpDir } = config.storage;
    const destinationPath = safeJoinFilePath(this.storageDir, filename);

    if (!isDirectoryPathValid(sourcePath, tmpDir)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Invalid file data');
    }

    await fse.ensureDir(this.storageDir);
    await fse.move(sourcePath, destinationPath, {
      overwrite: false,
    });
  }

  stream(file: File) {
    const filePath = safeJoinFilePath(this.storageDir, file.name);

    if (!fse.existsSync(filePath)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'File is missing in storage.');
    }

    return fse.createReadStream(filePath);
  }
}

class StaticStorage extends DiskStorage {
  constructor() {
    super(config.storage.staticDir);
  }

  async moveToStorage() {
    throw 'Static storage may not be accessed';
  }

  async remove() {
    throw 'Static storage may not be modified';
  }
}

const isDirectoryPathValid = (filePath: string, rootPath: string): boolean => {
  // Make sure, that the file path does not escape the root path
  const resolvedFilePath = path.resolve(filePath);
  const resolvedRootPath = path.resolve(rootPath);

  return resolvedFilePath.startsWith(resolvedRootPath);
};

const safeJoinFilePath = (rootPath: string, filename: string): string => {
  const filePath = path.join(rootPath, filename);

  if (!isDirectoryPathValid(filePath, rootPath)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid file');
  }

  return filePath;
};

export default {
  saveModelFile,
  createManyModelFile,
  modelFileCreateData,
  moveFileToStorage,
  getModelFile,
  getFileStream,
  queryModelFiles,
  queryFilesByIds,
  deleteFile,
  deleteTempFile,
  generateFileName,
  deleteUnreferencedFiles,
  deleteUnassignedFiles,
  deleteTempFiles,
};
