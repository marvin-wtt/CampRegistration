import { type File, Prisma, PrismaClient } from '#generated/prisma/client.js';
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
import type { AppConfig } from '#config';
import { Queue } from '#core/queue/Queue';
import { QueueManager } from '#core/queue/QueueManager';
import type { StorageFile } from '#core/storage/storage';
import { selectFileByLocale } from '@camp-registration/common/form';

type RequestFile = Express.Multer.File;

interface FileUploadJobPayload {
  id: string;
  name: string;
  originalName: string;
  type: string;
  tmpFileName: string;
  storageLocation: string;
}

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

type RequireIdKeys<TSource, TValue> = {
  [K in keyof TSource as K extends `${string}Id` ? K : never]-?: TValue;
};

type FileOwnerKey = keyof PickIds<Prisma.FileWhereInput>;

// Relational fields for where input fields
const fileRelationIdFieldsNull: RequireIdKeys<Prisma.FileWhereInput, null> = {
  campId: null,
  registrationId: null,
  messageId: null,
  messageDeliveryId: null,
  messageTemplateId: null,
  newsletterMessageId: null,
};

// Relational fields for create input fields
const fileRelationIdFieldsUndefined = Object.keys(
  fileRelationIdFieldsNull,
).reduce((acc, key) => ({ ...acc, [key]: undefined }), {});

@injectable()
export class FileService extends BaseService {
  private tmpStorage: DiskStorage;
  private storageRegistry: StorageRegistry;
  private queue: Queue<FileUploadJobPayload>;

  constructor(
    @Config() private readonly config: AppConfig,
    @inject(QueueManager) queueManager: QueueManager,
  ) {
    super();

    this.tmpStorage = new DiskStorage(config.storage.tmpDir);
    this.storageRegistry = new StorageRegistry(config.storage);

    this.queue = queueManager.create<FileUploadJobPayload>('file', {
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
    locale?: string | null,
    accessLevel?: string,
  ): Prisma.FileCreateInput => {
    return {
      type: file.mimetype,
      originalName: name ?? file.originalname,
      name: file.filename,
      size: file.size,
      field: extractKeyFromFieldName(field ?? file.fieldname),
      locale: locale ?? null,
      storageLocation: this.config.storage.location,
      accessLevel,
    };
  };

  async getFileById(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  private async uploadFile(payload: FileUploadJobPayload) {
    await this.storageRegistry
      .getStorage(payload.storageLocation)
      .moveToStorage(payload);

    await this.prisma.file.updateMany({
      where: { name: payload.name },
      data: {
        uploadStatus: 'READY',
        encryption: this.storageRegistry.getEncryptionFormat(),
      },
    });
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

  public getFileCreateManyInput(files: File[]) {
    return {
      createMany: {
        data: files.map((file) => ({
          ...file,
          ...this.getUnassignedModelArgs(),
          id: undefined,
        })),
      },
    };
  }

  public getUnreferencedModelArgs() {
    return fileRelationIdFieldsNull;
  }

  public getUnassignedModelArgs() {
    return fileRelationIdFieldsUndefined;
  }

  async syncFilesForOwner(
    tx: PrismaTransaction,
    ownerKey: FileOwnerKey,
    ownerId: string,
    fileIds: string[],
    sessionId: string,
    options?: { excludeFieldPrefix?: string },
  ) {
    // 1) Detach removed ones
    await tx.file.updateMany({
      where: {
        [ownerKey]: ownerId,
        id: { notIn: fileIds.length ? fileIds : ['__none__'] }, // avoid `notIn: []` edge cases
        // Files in an excluded field namespace are managed by a different
        // sync (e.g. custom-data files during a form-data sync).
        ...(options?.excludeFieldPrefix
          ? { NOT: { field: { startsWith: options.excludeFieldPrefix } } }
          : {}),
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

  /**
   * Synchronizes a set of named file slots (`field = prefix + name`) for an
   * owner in one pass: each slot is pointed at its given file id, or cleared
   * when the id is `null`. The previous occupant of a changed slot is
   * detached and picked up by the unassigned-file cleanup job.
   *
   * A file is only attachable when it already occupies a slot of the same
   * namespace on this owner or is an unreferenced temp file of the given
   * session. Slots whose id could not be resolved are left untouched and
   * their names are returned so the caller can decide how to fail.
   */
  async syncFileSlots(
    tx: PrismaTransaction,
    ownerKey: FileOwnerKey,
    ownerId: string,
    prefix: string,
    slots: Record<string, string | null>,
    sessionId: string,
  ): Promise<string[]> {
    const entries = Object.entries(slots);
    const requestedIds = entries
      .map(([, fileId]) => fileId)
      .filter((id) => id !== null);

    // One query validates every requested id at once.
    const validIds = new Set(
      requestedIds.length
        ? await tx.file
            .findMany({
              where: {
                id: { in: requestedIds },
                OR: [
                  { [ownerKey]: ownerId, field: { startsWith: prefix } },
                  { ...this.getUnreferencedModelArgs(), field: sessionId },
                ],
              },
              select: { id: true },
            })
            .then((files) => files.map((file) => file.id))
        : [],
    );

    const invalidNames: string[] = [];
    const toAttach: { name: string; fileId: string }[] = [];
    const toDetach: Prisma.FileWhereInput[] = [];

    for (const [name, fileId] of entries) {
      if (fileId !== null && !validIds.has(fileId)) {
        invalidNames.push(name);
        continue;
      }

      if (fileId !== null) {
        toAttach.push({ name, fileId });
      }

      toDetach.push({
        field: prefix + name,
        ...(fileId !== null ? { id: { not: fileId } } : {}),
      });
    }

    await Promise.all(
      toAttach.map(({ name, fileId }) =>
        tx.file.update({
          where: { id: fileId },
          data: { [ownerKey]: ownerId, field: prefix + name },
        }),
      ),
    );

    if (toDetach.length > 0) {
      await tx.file.updateMany({
        where: { [ownerKey]: ownerId, OR: toDetach },
        data: { [ownerKey]: null, field: null },
      });
    }

    return invalidNames;
  }

  async saveModelFile(
    model: ModelData | undefined,
    file: RequestFile,
    name?: string,
    field?: string,
    locale?: string | null,
    accessLevel?: string,
  ) {
    const originalFileName = name
      ? name + fileNameExtension(file.filename)
      : file.originalname;

    const fileData = this.mapFields(
      file,
      originalFileName,
      field,
      locale,
      accessLevel,
    );
    const modelData = model ? { [`${model.name}Id`]: model.id } : {};

    const created = await this.prisma.file.create({
      data: {
        ...fileData,
        ...modelData,
        uploadStatus: 'PENDING',
      },
    });

    await this.queue.add('upload', {
      id: created.id,
      name: created.name,
      originalName: created.originalName,
      type: created.type,
      storageLocation: created.storageLocation,
      tmpFileName: file.filename,
    });

    return created;
  }

  async getModelFile(modelName: string, modelId: string, id: string) {
    return this.prisma.file.findFirst({
      where: {
        id,
        [`${modelName}Id`]: modelId,
      },
    });
  }

  /**
   * Resolves the best-matching file for a form slot ({_file.<slot>}) on a model
   * and locale. The slot maps to the file's `field` column. Readiness and access
   * are not checked here — that is the caller's (guard/stream) responsibility.
   */
  async getModelFileForSlot(
    model: ModelData,
    slot: string,
    locale: string | undefined,
  ): Promise<File | null> {
    const files = await this.prisma.file.findMany({
      where: {
        [`${model.name}Id`]: model.id,
        field: slot,
      },
    });

    if (files.length === 0) {
      return null;
    }

    // Select the best matching file for the locale.
    // If no locale is given, default to English or fallback to the first file.
    return selectFileByLocale(files, locale ?? 'en') ?? files[0];
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
    const sortBy = options.sortBy ?? 'name';
    const sortType = options.sortType ?? 'desc';

    const skip =
      options.page && options.limit
        ? (options.page - 1) * options.limit
        : undefined;
    const take = options.limit;

    return this.prisma.file.findMany({
      where: {
        name: filter.name ? { startsWith: `_${filter.name}_` } : undefined,
        type: filter.type,
        [`${model.name}Id`]: model.id,
      },
      skip,
      take,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined,
    });
  }

  async getFileStream(file: StorageFile) {
    const stream = await this.storageRegistry
      .getStorage(file.storageLocation)
      .openReadStream(file);

    // Decryption/storage errors surface asynchronously, possibly before the
    // consumer (HTTP response, mail transport) attaches its own 'error'
    // listener — without one here, such an error crashes the process.
    stream.on('error', (error: Error) => {
      logger.error(`Error while streaming file "${file.id}"`, error);
    });

    return stream;
  }

  async updateFile(
    id: string,
    data: {
      name?: string;
      field?: string;
      locale?: string | null;
      accessLevel?: string;
    },
  ) {
    return this.prisma.file.update({
      where: { id },
      data: {
        originalName: data.name,
        field: data.field,
        locale: data.locale,
        accessLevel: data.accessLevel,
      },
    });
  }

  async deleteFile(id: string) {
    const file = await this.prisma.file.delete({
      where: {
        id,
      },
    });

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

  /**
   * Duplicates the file models without model relationship so that they can be attached to a new model by another request
   */
  async duplicateFiles(files: File[], sessionId: string) {
    // CreateManyAndReturn is currently not supported for MySQL
    return this.prisma.$transaction(
      files.map((file) =>
        this.prisma.file.create({
          data: {
            name: file.name,
            originalName: file.originalName,
            type: file.type,
            size: file.size,
            locale: file.locale,
            accessLevel: file.accessLevel,
            storageLocation: file.storageLocation,
            uploadStatus: file.uploadStatus,
            // The duplicate points at the same stored blob, so it must
            // record the same encryption format.
            encryption: file.encryption,
            field: sessionId,
          },
        }),
      ),
    );
  }

  async deleteUnreferencedFiles(): Promise<void> {
    const fileModels = await this.prisma.file.findMany({
      where: {
        storageLocation: {
          in: ['disk', 's3'],
        },
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
        ...fileRelationIdFieldsNull,
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

    // Tmp files that are still the only copy of an upload which has not yet
    // reached storage — e.g. the storage provider is temporarily unavailable
    // and the upload job is still being retried (or awaiting an admin retry).
    // Their tmp name matches the File row's `name`, so preserving them lets
    // the upload recover once storage is reachable again instead of the file
    // being lost to cleanup. Encryption staging files (`<name>.<uuid>.enc`)
    // never match a File name, so orphaned ones are still pruned.
    const pendingUploads = await this.prisma.file.findMany({
      where: { uploadStatus: 'PENDING' },
      select: { name: true },
    });
    const pendingNames = new Set(pendingUploads.map((file) => file.name));

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

    const isExpired = (fileName: string): boolean =>
      isOlderThanOneHour(fileName) && !pendingNames.has(fileName);

    const results = await Promise.all(
      fileNames
        .filter(isExpired)
        .map((fileName) => this.tmpStorage.removeFile(fileName)),
    );

    logger.info(
      `Deleted ${results.length.toString()} unused temporary file(s) from disk`,
    );
  }

  public async getOverviewCounts() {
    const total = await this.prisma.file.count();

    return { total };
  }

  public async close() {
    await this.queue.close();
  }
}
