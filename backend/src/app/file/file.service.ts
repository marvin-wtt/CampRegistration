import { type File, Prisma, PrismaClient } from '@prisma/client';
import { ulid } from '#utils/ulid';
import { extractKeyFromFieldName } from '#utils/form';
import { decodeTime, isValid } from 'ulidx';
import moment from 'moment';
import logger from '#core/logger';
import { DiskStorage } from '#core/storage/disk.storage';
import { StorageRegistry } from '#core/storage/storage.registry';
import { BaseService } from '#core/base/BaseService';
import { fileNameExtension } from '#utils/file';
import { inject, injectable } from 'inversify';
import { Config } from '#core/ioc/decorators';
import type { AppConfig } from '#config/index';
import { Queue } from '#core/queue/Queue';
import { QueueManager } from '#core/queue/QueueManager';

type RequestFile = Express.Multer.File;

interface ModelData {
  id: string;
  name: string;
}

type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

type PickIds<T> = {
  [K in keyof T as K extends `${string}Id` ? K : never]: T[K];
};

type FileOwnerKey = keyof PickIds<Prisma.FileWhereInput>;

const fileRelationIdFields = Prisma.dmmf.datamodel.models
  .find((value) => value.name === 'File')
  ?.fields.filter((field) => field.name.match(/[A-Za-z]+Id$/g))
  .reduce<Record<string, null>>((acc, val) => {
    const fieldName = val.name;
    acc[fieldName] = null;
    return acc;
  }, {}) as PickIds<Prisma.FileWhereInput>;

@injectable()
export class FileService extends BaseService {
  private tmpStorage: DiskStorage;
  private storageRegistry: StorageRegistry;
  private queue: Queue<string>;

  constructor(
    @Config() private readonly config: AppConfig,
    @inject(QueueManager) queueManager: QueueManager,
  ) {
    super();

    this.tmpStorage = new DiskStorage(config.storage.tmpDir);
    this.storageRegistry = new StorageRegistry(config.storage);

    this.queue = queueManager.create<string>('file', {
      retryDelay: 1000 * 10,
    });

    this.queue.process(async (job) => {
      if (job.name === 'upload') {
        await this.uploadFile(job.payload);
        return;
      }

      throw new Error(`Unknown file job: "${job.name}"`);
    });
  }

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
      storageLocation: this.config.storage.location,
      accessLevel,
    };
  };

  async getFileById(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  private async uploadFile(filename: string) {
    await this.storageRegistry.getStorage().moveToStorage(filename);
  }

  public getFileConnectInput(
    files: Pick<File, 'id'>[] | string[],
    field: string,
  ) {
    return {
      connect: files
        .map((file) => (typeof file === 'string' ? file : file.id))
        .map((id) => ({
          ...this.getUnreferencedModelArgs(),
          id,
          field,
        })),
    };
  }

  public getUnreferencedModelArgs() {
    return fileRelationIdFields;
  }

  async syncFilesForOwner(
    tx: PrismaTransaction,
    ownerKey: FileOwnerKey,
    ownerId: string,
    fileIds: string[],
    sessionId: string,
  ) {
    // 1) Detach removed ones
    await tx.file.updateMany({
      where: {
        [ownerKey]: ownerId,
        id: { notIn: fileIds.length ? fileIds : ['__none__'] }, // avoid `notIn: []` edge cases
      },
      data: {
        [ownerKey]: null,
        field: null,
      },
    });

    // 2) Build connect filter
    // Allow connecting if already connected to this owner OR unreferenced temp with matching field
    const connect = fileIds.map((id) => ({
      id,
      OR: [
        { [ownerKey]: ownerId },
        { ...this.getUnreferencedModelArgs(), field: sessionId },
      ],
    }));

    return { connect };
  }

  async saveModelFile(
    model: ModelData | undefined,
    file: RequestFile,
    name?: string,
    field?: string,
    accessLevel?: string,
  ) {
    const originalFileName = name
      ? name + fileNameExtension(file.filename)
      : file.originalname;

    const fileData = this.mapFields(file, originalFileName, field, accessLevel);
    const modelData = model ? { [`${model.name}Id`]: model.id } : {};

    await this.queue.add('upload', file.filename);

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

    return fileName + fileExtension;
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
        ...fileRelationIdFields,
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

  public async close() {
    await this.queue.close();
  }
}
