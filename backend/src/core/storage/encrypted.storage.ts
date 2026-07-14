import { createReadStream, createWriteStream } from 'fs';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { PassThrough, type Readable } from 'stream';
import fse from 'fs-extra';
import type {
  Storage,
  StorageFile,
  StorageMoveFile,
} from '#core/storage/storage';
import type { StorageKeyring } from '#core/storage/encryption/keyring';
import { safeJoinFilePath } from '#core/storage/safe-path';
import {
  ENCRYPTION_FORMAT,
  createDecryptStream,
  createEncryptStream,
} from '#core/storage/encryption/envelope';

/**
 * Decorator that transparently encrypts files at rest, independent of the
 * underlying driver: the tmp file is encrypted into a staging file the
 * inner storage picks up, so drivers (disk today, s3 later) only ever
 * handle opaque blobs. Which stored files are encrypted is recorded on the
 * `File` model (`encryption`); files stored as plaintext are streamed back
 * unchanged.
 *
 * With a `null` keyring (encryption not configured) files are stored and
 * streamed as plaintext, but reads of files recorded as encrypted fail
 * loudly instead of serving raw ciphertext.
 */
export class EncryptedStorage implements Storage {
  constructor(
    private readonly inner: Storage,
    private readonly keyring: StorageKeyring | null,
    private readonly tmpDir: string,
  ) {}

  removeFile(fileName: string): Promise<void> {
    return this.inner.removeFile(fileName);
  }

  getFileNames(): Promise<string[]> {
    return this.inner.getFileNames();
  }

  async moveToStorage(file: StorageMoveFile): Promise<void> {
    if (this.keyring === null) {
      await this.inner.moveToStorage(file);
      return;
    }

    // The plaintext tmp file stays untouched until the inner move
    // succeeded, so a retried — or, after stalled-job redelivery, even
    // concurrent — upload job simply re-encrypts from pristine plaintext;
    // nothing ever needs to detect (or could double-encrypt) an already
    // encrypted file. Unique staging names keep concurrent attempts from
    // interleaving writes, and the hourly tmp cleanup prunes orphans.
    const sourcePath = safeJoinFilePath(this.tmpDir, file.tmpFileName);
    const stagingName = `${file.tmpFileName}.${randomUUID()}.enc`;
    const stagingPath = safeJoinFilePath(this.tmpDir, stagingName);

    try {
      await pipeline([
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        createReadStream(sourcePath),
        createEncryptStream(this.keyring.encrypt),
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        createWriteStream(stagingPath),
      ]);
      // The inner driver moves whatever `tmpFileName` names, so point it at
      // the ciphertext staging file while `name` (the stored blob) is kept.
      await this.inner.moveToStorage({ ...file, tmpFileName: stagingName });
    } catch (error) {
      await fse.remove(stagingPath);
      throw error;
    }

    await fse.remove(sourcePath);
  }

  async openReadStream(file: StorageFile): Promise<Readable> {
    if (file.encryption === null) {
      return this.inner.openReadStream(file);
    }

    if (file.encryption !== ENCRYPTION_FORMAT) {
      return erroredStream(
        new Error(
          `File "${file.id}" uses the unknown encryption format "${file.encryption}"`,
        ),
      );
    }

    if (this.keyring === null) {
      return erroredStream(
        new Error(
          `File "${file.id}" is encrypted at rest, but STORAGE_ENCRYPTION_KEYS is not configured`,
        ),
      );
    }

    return createDecryptStream(
      this.keyring.decrypt,
      await this.inner.openReadStream(file),
      file.size,
    );
  }
}

function erroredStream(error: Error): Readable {
  const out = new PassThrough();
  out.destroy(error);
  return out;
}
