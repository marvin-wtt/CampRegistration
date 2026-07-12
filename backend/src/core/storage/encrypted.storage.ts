import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';
import fse from 'fs-extra';
import type { KeyringNode } from '@aws-crypto/client-node';
import type { Storage, StorageFile } from '#core/storage/storage';
import { safeJoinFilePath } from '#core/storage/safe-path';
import {
  createDecryptStream,
  createEncryptStreams,
  isEncryptedByUs,
} from '#core/storage/encryption/envelope';

/**
 * Decorator that transparently encrypts files at rest, independent of the
 * underlying driver: the tmp file is encrypted in place before the inner
 * storage picks it up, so drivers (disk today, s3 later) only ever handle
 * opaque blobs. Files stored before encryption was enabled are streamed
 * back unchanged.
 */
export class EncryptedStorage implements Storage {
  constructor(
    private readonly inner: Storage,
    private readonly keyring: KeyringNode,
    private readonly tmpDir: string,
  ) {}

  removeFile(fileName: string): Promise<void> {
    return this.inner.removeFile(fileName);
  }

  getFileNames(): Promise<string[]> {
    return this.inner.getFileNames();
  }

  async moveToStorage(filename: string): Promise<void> {
    await this.encryptFile(filename);

    await this.inner.moveToStorage(filename);
  }

  private async encryptFile(filename: string) {
    const sourcePath = safeJoinFilePath(this.tmpDir, filename);

    // A retried upload job may find the tmp file already encrypted by an
    // attempt that failed after the encryption step; plaintext uploads that
    // merely start with the magic bytes cannot spoof the check.
    const isEncrypted = await isEncryptedByUs(this.keyring, sourcePath);
    if (isEncrypted) {
      return;
    }

    const encryptedPath = sourcePath + '.enc';

    try {
      await pipeline([
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        createReadStream(sourcePath),
        ...createEncryptStreams(this.keyring),
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        createWriteStream(encryptedPath),
      ]);
    } catch (error) {
      await fse.remove(encryptedPath);
      throw error;
    }

    await fse.move(encryptedPath, sourcePath, { overwrite: true });
  }

  stream(file: StorageFile): Readable {
    return createDecryptStream(
      this.keyring,
      this.inner.stream(file),
      file.size,
    );
  }
}
