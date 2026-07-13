import { createReadStream, createWriteStream } from 'fs';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';
import fse from 'fs-extra';
import type { Storage, StorageFile } from '#core/storage/storage';
import type { StorageKeyring } from '#core/storage/encryption/keyring';
import { safeJoinFilePath } from '#core/storage/safe-path';
import {
  createDecryptStream,
  createEncryptStreams,
  hasMagicPrefix,
  isEncryptedByUs,
} from '#core/storage/encryption/envelope';

/**
 * Decorator that transparently encrypts files at rest, independent of the
 * underlying driver: the tmp file is encrypted in place before the inner
 * storage picks it up, so drivers (disk today, s3 later) only ever handle
 * opaque blobs. Files stored before encryption was enabled are streamed
 * back unchanged.
 *
 * With a `null` keyring (encryption not configured) files are stored and
 * streamed as plaintext, but reads of previously encrypted files fail
 * loudly instead of serving raw ciphertext, and uploads that spoof the
 * envelope magic are rejected so they cannot become undecryptable once
 * encryption is enabled.
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

  async moveToStorage(filename: string): Promise<void> {
    const sourcePath = safeJoinFilePath(this.tmpDir, filename);

    if (this.keyring === null) {
      // Stored plaintext starting with the magic bytes would be mistaken
      // for ciphertext — and become permanently unservable — as soon as
      // encryption is enabled.
      if (await hasMagicPrefix(sourcePath)) {
        throw new Error(
          `Upload "${filename}" starts with the encryption magic bytes but STORAGE_ENCRYPTION_KEYS is not configured — refusing to store it as plaintext`,
        );
      }
    } else {
      await this.encryptFile(sourcePath, this.keyring);
    }

    await this.inner.moveToStorage(filename);
  }

  private async encryptFile(sourcePath: string, keyring: StorageKeyring) {
    // A retried upload job may find the tmp file already encrypted by an
    // attempt that failed after the encryption step; plaintext uploads that
    // merely start with the magic bytes cannot spoof the check.
    const isEncrypted = await isEncryptedByUs(keyring.decrypt, sourcePath);
    if (isEncrypted) {
      return;
    }

    // Unique per attempt: a stalled-job redelivery running concurrently must
    // not interleave writes into the same output file — each attempt
    // produces a complete, valid ciphertext before the rename.
    const encryptedPath = `${sourcePath}.${randomUUID()}.enc`;

    try {
      await pipeline([
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        createReadStream(sourcePath),
        ...createEncryptStreams(keyring.encrypt),
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
      this.keyring?.decrypt ?? null,
      this.inner.stream(file),
      file.size,
    );
  }
}
