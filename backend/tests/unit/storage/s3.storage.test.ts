import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import path from 'node:path';
import os from 'node:os';
import fse from 'fs-extra';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';

const { sendMock, getSignedUrlMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getSignedUrlMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return {
    ...actual,
    S3Client: class {
      send = sendMock;
    },
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: getSignedUrlMock,
}));

// Imported after the mocks are registered so the storage picks up the mocked
// client.
const { S3Storage } = await import('#core/storage/s3.storage');

const baseOptions = {
  endpoint: 'https://s3.example.com',
  region: 'us-east-1',
  bucket: 'test-bucket',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  forcePathStyle: true,
  presignedDownloadLifetimeSeconds: 60,
  tmpDir: os.tmpdir(),
};

function storageFile(name: string) {
  return {
    id: 'id',
    originalName: 'original.txt',
    name,
    field: null,
    size: 3,
    type: 'text/plain',
    accessLevel: null,
    storageLocation: 's3',
  };
}

function serviceError(name: string, httpStatusCode: number, retryable = false) {
  const error = new S3ServiceException({
    name,
    $fault: httpStatusCode >= 500 ? 'server' : 'client',
    $metadata: { httpStatusCode },
    message: name,
  });
  if (retryable) {
    error.$retryable = { throttling: false };
  }
  return error;
}

describe('S3Storage', () => {
  beforeEach(() => {
    sendMock.mockReset();
    getSignedUrlMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('object prefix', () => {
    it('prepends a normalized prefix to object keys', async () => {
      sendMock.mockResolvedValue({});
      const storage = new S3Storage({
        ...baseOptions,
        objectPrefix: '/uploads/',
      });

      await storage.removeFile('file.txt');

      const command = sendMock.mock.calls[0][0];
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'uploads/file.txt',
      });
    });

    it('uses the bare key when no prefix is configured', async () => {
      sendMock.mockResolvedValue({});
      const storage = new S3Storage(baseOptions);

      await storage.removeFile('file.txt');

      expect(sendMock.mock.calls[0][0].input.Key).toBe('file.txt');
    });
  });

  describe('getFileNames', () => {
    it('paginates and strips the prefix, skipping keys outside it', async () => {
      const storage = new S3Storage({
        ...baseOptions,
        objectPrefix: 'uploads',
      });

      sendMock
        .mockResolvedValueOnce({
          Contents: [{ Key: 'uploads/a.txt' }, { Key: 'other/b.txt' }],
          IsTruncated: true,
          NextContinuationToken: 'token',
        })
        .mockResolvedValueOnce({
          Contents: [{ Key: 'uploads/c.txt' }, { Key: undefined }],
          IsTruncated: false,
        });

      const names = await storage.getFileNames();

      expect(names).toEqual(['a.txt', 'c.txt']);
      const firstCommand = sendMock.mock.calls[0][0];
      expect(firstCommand).toBeInstanceOf(ListObjectsV2Command);
      expect(firstCommand.input.Prefix).toBe('uploads/');
      expect(sendMock.mock.calls[1][0].input.ContinuationToken).toBe('token');
    });
  });

  describe('openReadStream', () => {
    it('returns the body stream', async () => {
      const body = Readable.from(['data']);
      sendMock.mockResolvedValue({ Body: body });
      const storage = new S3Storage(baseOptions);

      const stream = await storage.openReadStream(storageFile('file.txt'));

      expect(stream).toBe(body);
      expect(sendMock.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    });

    it('throws when the provider returns a non-stream body', async () => {
      sendMock.mockResolvedValue({ Body: 'not-a-stream' });
      const storage = new S3Storage(baseOptions);

      await expect(
        storage.openReadStream(storageFile('file.txt')),
      ).rejects.toMatchObject({ statusCode: httpStatus.BAD_GATEWAY });
    });
  });

  describe('moveToStorage', () => {
    it('uploads with a known content length and removes the temp file', async () => {
      sendMock.mockResolvedValue({});
      const tmpDir = await fse.mkdtemp(path.join(os.tmpdir(), 's3-test-'));
      const tmpFileName = 'source.tmp';
      const sourcePath = path.join(tmpDir, tmpFileName);
      await fse.writeFile(sourcePath, 'hello');

      const storage = new S3Storage({ ...baseOptions, tmpDir });

      await storage.moveToStorage({
        id: 'id',
        name: 'target.txt',
        originalName: 'original.txt',
        type: 'text/plain',
        tmpFileName,
      });

      const command = sendMock.mock.calls[0][0];
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toMatchObject({
        Key: 'target.txt',
        ContentType: 'text/plain',
        ContentLength: 5,
        IfNoneMatch: '*',
      });
      expect(await fse.pathExists(sourcePath)).toBe(false);

      await fse.remove(tmpDir);
    });
  });

  describe('error mapping', () => {
    it.each([
      { name: 'NoSuchKey', status: 404, expected: httpStatus.NOT_FOUND },
      { name: 'NotFound', status: 404, expected: httpStatus.NOT_FOUND },
    ])('maps $name to $expected', async ({ name, status, expected }) => {
      sendMock.mockRejectedValue(serviceError(name, status));
      const storage = new S3Storage(baseOptions);

      await expect(
        storage.openReadStream(storageFile('file.txt')),
      ).rejects.toMatchObject({ statusCode: expected });
    });

    it('maps auth errors to a non-operational configuration error', async () => {
      sendMock.mockRejectedValue(serviceError('AccessDenied', 403));
      const storage = new S3Storage(baseOptions);

      const error = await storage
        .removeFile('file.txt')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        isOperational: false,
        code: 'S3_AUTH_CONFIGURATION_ERROR',
      });
    });

    it('maps 5xx provider errors to a retryable service-unavailable error', async () => {
      sendMock.mockRejectedValue(serviceError('InternalError', 500));
      const storage = new S3Storage(baseOptions);

      const error = await storage
        .removeFile('file.txt')
        .catch((e: unknown) => e);

      expect(error).toMatchObject({
        statusCode: httpStatus.SERVICE_UNAVAILABLE,
        isOperational: true,
        code: 'S3_TEMPORARY_PROVIDER_ERROR',
      });
    });

    it('maps network errors to a retryable service-unavailable error', async () => {
      sendMock.mockRejectedValue(
        Object.assign(new Error('connect ECONNREFUSED'), {
          code: 'ECONNREFUSED',
        }),
      );
      const storage = new S3Storage(baseOptions);

      const error = await storage
        .removeFile('file.txt')
        .catch((e: unknown) => e);

      expect(error).toMatchObject({
        statusCode: httpStatus.SERVICE_UNAVAILABLE,
        isOperational: true,
        code: 'S3_TEMPORARY_NETWORK_ERROR',
      });
    });

    it('maps unknown errors to a bad-gateway provider error', async () => {
      sendMock.mockRejectedValue(new Error('boom'));
      const storage = new S3Storage(baseOptions);

      const error = await storage
        .removeFile('file.txt')
        .catch((e: unknown) => e);

      expect(error).toMatchObject({
        statusCode: httpStatus.BAD_GATEWAY,
        isOperational: false,
        code: 'S3_PROVIDER_ERROR',
      });
    });
  });
});
