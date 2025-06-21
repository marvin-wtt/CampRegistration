import type { File, Prisma } from '@prisma/client';
import config from '#config/index';
import { ulid } from '#utils/ulid';
import { extractKeyFromFieldName } from '#utils/form';
import { decodeTime, isValid } from 'ulidx';
import moment from 'moment';
import logger from '#core/logger';
import { DiskStorage } from '#core/storage/disk.storage';
import { StorageRegistry } from '#core/storage/storage.registry';
import { BaseService } from '#core/base/BaseService';

type RequestFile = Express.Multer.File;

interface ModelData {
  id: string;
  name: string;
}

const fileNameExtension = (fileName: string): string => {
  if (!fileName.includes('.')) {
    return '';
  }

  const extension = fileName.split('.').pop() ?? '';

  return `.${extension}`;
};

export class FileService extends BaseService {
  private tmpStorage = new DiskStorage(config.storage.tmpDir);
  private storageRegistry = new StorageRegistry();

  private mapFields = (
    file: RequestFile,
    name?: string,
    field?: string,
    accessLevel?: string,
  ): Prisma.FileCreateInput => {
    return {
      type: file.mimetype,
      originalName: name ?? file.originalname,
      name: file.filename,
      size: file.size,
      field: extractKeyFromFieldName(field ?? file.fieldname),
      storageLocation: config.storage.location,
      accessLevel,
    };
  };

  private async moveFile(file: RequestFile) {
    // TODO Do I need to wait? Can this be done in a job? What are the fail-safe mechanisms?
    await this.storageRegistry.getStorage().moveToStorage(file.filename);
  }

  async saveModelFile(
    model: ModelData | undefined,
    file: RequestFile,
    name?: string,
    field?: string,
    accessLevel?: string,
  ) {
    const fileName = name
      ? name + fileNameExtension(file.filename)
      : file.filename;
    const fileData = this.mapFields(file, fileName, field, accessLevel);
    const modelData = model ? { [`${model.name}Id`]: model.id } : {};

    // Move file first to ensure that they really exist
    await this.moveFile(file);

    return this.prisma.file.create({
      data: {
        ...fileData,
        ...modelData,
      },
    });
  }

  async getModelFile(modelName: string, modelId: string, id: string) {
    return this.prisma.file.findFirst({
      where: {
        id,
        [`${modelName}Id`]: modelId,
      },
    });
  }

  async queryModelFiles(
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
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'name';
    const sortType = options.sortType ?? 'desc';

    return this.prisma.file.findMany({
      where: {
        name: filter.name ? { startsWith: `_${filter.name}_` } : undefined,
        type: filter.type,
        [`${model.name}Id`]: model.id,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined,
    });
  }

  getFileStream(file: File) {
    return this.storageRegistry.getStorage(file.storageLocation).stream(file);
  }

  async deleteFile(id: string) {
    const file = await this.prisma.file.delete({
      where: {
        id,
      },
    });

    const fileCount = await this.prisma.file.count({
      where: {
        name: file.name,
      },
    });

    // Do not delete file from storage if other references still exist
    if (fileCount > 0) {
      return file;
    }

    // Check if other files still reference the file on the disk
    const remainingReferences = await this.prisma.file.count({
      where: {
        name: file.name,
      },
    });

    // Only delete the file if no further references are present
    if (remainingReferences > 0) {
      return;
    }

    const storage = this.storageRegistry.getStorage(file.storageLocation);
    try {
      await storage.removeFile(file.name);
    } catch (e) {
      // Do not throw an error because the operation seems successfully to the user anyway
      logger.error(`Error while deleting file: ${file.name}.`);
      logger.error(e);
    }
  }

  async deleteTempFile(fileName: string) {
    return this.tmpStorage.removeFile(fileName);
  }

  generateFileName(originalName: string): string {
    const fileName = ulid();
    const fileExtension = fileNameExtension(originalName);

    return `${fileName}.${fileExtension}`;
  }

  async deleteUnreferencedFiles(): Promise<void> {
    const fileModels = await this.prisma.file.findMany({
      where: {
        storageLocation: 'local',
      },
      select: {
        name: true,
        storageLocation: true,
      },
    });

    const fileModesByLocation = Object.groupBy(
      fileModels,
      (fileModel) => fileModel.storageLocation,
    );

    for (const [location, models] of Object.entries(fileModesByLocation)) {
      if (!models) {
        continue;
      }
      const fileModelNames = models.map((value) => value.name);

      const storage = this.storageRegistry.getStorage(location);

      const fileNames = await storage.getFileNames();
      const filesToDelete = fileNames.filter(
        (fileName) => !fileModelNames.includes(fileName),
      );

      logger.info(
        `Deleting ${filesToDelete.length.toString()} file(s) from ${location} storage`,
      );

      await Promise.all(
        filesToDelete.map((fileName) => storage.removeFile(fileName)),
      );
    }
  }

  async deleteUnassignedFiles(): Promise<void> {
    const minAge = moment().subtract('1', 'd').toDate();

    const files = await this.prisma.file.findMany({
      where: {
        campId: null,
        registrationId: null,
        messageId: null,
        messageTemplateId: null,
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
    const result = await this.prisma.file.deleteMany({
      where: { id: { in: fileIds } },
    });

    // Check if any file is still referenced by another model
    const fileNames = files.map((file) => file.name);
    const usedFiles = await this.prisma.file.findMany({
      where: { name: { in: fileNames } },
      select: { name: true },
    });

    logger.info(`Deleting ${result.count.toString()} unreferenced file(s)`);

    // Delete files from storage that are no longer in use
    const fileDeletions = files
      .filter((file) => !usedFiles.some((value) => value.name === file.name))
      .map((file) =>
        this.storageRegistry
          .getStorage(file.storageLocation)
          .removeFile(file.name),
      );

    await Promise.all(fileDeletions);
  }

  async deleteTempFiles() {
    const fileNames = await this.tmpStorage.getFileNames();
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
      fileNames
        .filter(isOlderThanOneHour)
        .map((fileName) => this.tmpStorage.removeFile(fileName)),
    );

    logger.info(
      `Deleted ${results.length.toString()} unused temporary file(s) from disk`,
    );
  }
}

export default new FileService();
