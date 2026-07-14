import type {
  Storage,
  StorageFile,
  StorageMoveFile,
} from '#core/storage/storage';
import {
  GetObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandInput,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import fse from 'fs-extra';
import { Readable } from 'stream';
import path from 'path';

export interface S3StorageOptions {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
  objectPrefix?: string;
  presignedDownloadLifetimeSeconds: number;
  tmpDir: string;
}

const S3_AUTH_ERROR_NAMES = new Set([
  'AccessDenied',
  'InvalidAccessKeyId',
  'SignatureDoesNotMatch',
  'AuthorizationHeaderMalformed',
  'InvalidToken',
]);

const S3_NOT_FOUND_ERROR_NAMES = new Set(['NoSuchKey', 'NotFound']);

const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EAI_AGAIN',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  'TimeoutError',
]);

export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly objectPrefix: string;

  constructor(private readonly options: S3StorageOptions) {
    this.objectPrefix = this.normalizeObjectPrefix(options.objectPrefix);

    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: options.forcePathStyle,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            }
          : undefined,
    });
  }

  private normalizeObjectPrefix(prefix: string | undefined): string {
    return (prefix ?? '').replace(/^\/+|\/+$/g, '');
  }

  private withPrefix(logicalKey: string): string {
    if (!this.objectPrefix) {
      return logicalKey;
    }

    return `${this.objectPrefix}/${logicalKey}`;
  }

  private withoutPrefix(key: string): string | null {
    if (!this.objectPrefix) {
      return key;
    }

    const prefixedPath = `${this.objectPrefix}/`;
    if (!key.startsWith(prefixedPath)) {
      return null;
    }

    const logicalKey = key.slice(prefixedPath.length);
    return logicalKey.length ? logicalKey : null;
  }

  private listPrefix(): string | undefined {
    return this.objectPrefix.length ? `${this.objectPrefix}/` : undefined;
  }

  private isDirectoryPathValid(filePath: string, rootPath: string): boolean {
    const resolvedFilePath = path.resolve(filePath);
    const resolvedRootPath = path.resolve(rootPath);

    return resolvedFilePath.startsWith(resolvedRootPath);
  }

  private safeJoinFilePath(rootPath: string, filename: string): string {
    const filePath = path.join(rootPath, filename);

    if (!this.isDirectoryPathValid(filePath, rootPath)) {
      throw new Error('Invalid file');
    }

    return filePath;
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof S3ServiceException) {
      if (S3_NOT_FOUND_ERROR_NAMES.has(error.name)) {
        return new ApiError(
          httpStatus.NOT_FOUND,
          'File is missing in storage.',
        );
      }

      if (S3_AUTH_ERROR_NAMES.has(error.name)) {
        return new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Storage access failed due to invalid storage configuration.',
          false,
          error.stack,
          'S3_AUTH_CONFIGURATION_ERROR',
        );
      }

      if (error.$retryable || (error.$metadata.httpStatusCode ?? 0) >= 500) {
        return new ApiError(
          httpStatus.SERVICE_UNAVAILABLE,
          'Storage provider is temporarily unavailable.',
          true,
          error.stack,
          'S3_TEMPORARY_PROVIDER_ERROR',
        );
      }
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string' &&
      NETWORK_ERROR_CODES.has(error.code)
    ) {
      return new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Storage provider is temporarily unavailable.',
        true,
        error instanceof Error ? error.stack : undefined,
        'S3_TEMPORARY_NETWORK_ERROR',
      );
    }

    return new ApiError(
      httpStatus.BAD_GATEWAY,
      'Storage provider request failed.',
      false,
      error instanceof Error ? error.stack : undefined,
      'S3_PROVIDER_ERROR',
    );
  }

  async moveToStorage(file: StorageMoveFile): Promise<void> {
    const sourcePath = this.safeJoinFilePath(
      this.options.tmpDir,
      file.tmpFileName,
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const { size } = await fse.stat(sourcePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const sourceFileStream = fse.createReadStream(sourcePath);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.options.bucket,
          Key: this.withPrefix(file.name),
          ContentType: file.type,
          // Pass a known length so the SDK can stream directly instead of
          // buffering the file to compute it — and so S3-compatible providers
          // that reject `aws-chunked` uploads still accept the request.
          ContentLength: size,
          Body: sourceFileStream,
          IfNoneMatch: '*',
        }),
      );

      await fse.remove(sourcePath);
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  async removeFile(fileName: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.options.bucket,
          Key: this.withPrefix(fileName),
        }),
      );
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  async getFileNames(): Promise<string[]> {
    const names: string[] = [];
    let continuationToken: string | undefined;

    do {
      const listOptions: ListObjectsV2CommandInput = {
        Bucket: this.options.bucket,
        Prefix: this.listPrefix(),
        ContinuationToken: continuationToken,
      };

      try {
        const result = await this.client.send(
          new ListObjectsV2Command(listOptions),
        );

        for (const object of result.Contents ?? []) {
          const objectKey = object.Key;
          if (!objectKey) {
            continue;
          }

          const logicalKey = this.withoutPrefix(objectKey);
          if (logicalKey) {
            names.push(logicalKey);
          }
        }

        continuationToken = result.IsTruncated
          ? result.NextContinuationToken
          : undefined;
      } catch (error) {
        throw this.toApiError(error);
      }
    } while (continuationToken);

    return names;
  }

  async openReadStream(file: StorageFile): Promise<Readable> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.options.bucket,
          Key: this.withPrefix(file.name),
        }),
      );

      if (!(result.Body instanceof Readable)) {
        throw new ApiError(
          httpStatus.BAD_GATEWAY,
          'Storage provider returned an invalid file stream.',
          false,
          undefined,
          'S3_INVALID_STREAM',
        );
      }

      return result.Body;
    } catch (error) {
      throw this.toApiError(error);
    }
  }
}
