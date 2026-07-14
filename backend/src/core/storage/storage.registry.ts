import type { Storage } from '#core/storage/storage';
import { DiskStorage } from '#core/storage/disk.storage';
import { StaticStorage } from '#core/storage/static.storage';
import { EncryptedStorage } from '#core/storage/encrypted.storage';
import { ENCRYPTION_FORMAT } from '#core/storage/encryption/envelope';
import {
  parseStorageKeyring,
  type StorageKeyring,
} from '#core/storage/encryption/keyring';
import type { StorageConfig } from '#config';
import logger from '#core/logger';
import { S3Storage } from '#core/storage/s3.storage';

export class StorageRegistry {
  private storageCache: Map<string, Storage>;
  private rawStorageCache: Map<string, Storage>;
  private readonly keyring: StorageKeyring | null;

  constructor(private options: StorageConfig) {
    this.storageCache = new Map();
    this.rawStorageCache = new Map();
    this.keyring = options.encryptionKeys
      ? parseStorageKeyring(options.encryptionKeys)
      : null;

    if (this.keyring === null) {
      logger.warn(
        'STORAGE_ENCRYPTION_KEYS is not set — uploaded files are stored unencrypted',
      );
    }
  }

  getStorage(identifier?: string): Storage {
    identifier ??= this.options.location;
    // Backwards compatibility
    identifier = identifier === 'local' ? 'disk' : identifier;

    if (!this.storageCache.has(identifier)) {
      this.storageCache.set(identifier, this.loadStorage(identifier));
    }

    const storage = this.storageCache.get(identifier);
    /* c8 ignore next 3 */
    if (!storage) {
      throw new Error('Invalid storage');
    }

    return storage;
  }

  /**
   * The undecorated driver for `identifier` — no transparent encryption.
   * Application code should use `getStorage()`; this is for tooling that
   * manages ciphertext directly, so it can write a blob's bytes as-is on
   * any driver without `EncryptedStorage` re-encrypting (or refusing to
   * decrypt) on top.
   */
  getRawStorage(identifier?: string): Storage {
    identifier ??= this.options.location;

    return this.rawStorage(identifier);
  }

  /**
   * The `File.encryption` value that `moveToStorage` on the given storage
   * produces: the envelope format when encryption applies, `null` when the
   * file is stored as plaintext.
   */
  getEncryptionFormat(identifier?: string): string | null {
    identifier ??= this.options.location;

    return this.keyring !== null && identifier !== 'static'
      ? ENCRYPTION_FORMAT
      : null;
  }

  private loadStorage(identifier: string): Storage {
    const storage = this.rawStorage(identifier);

    // Static assets are public and served plaintext.
    if (identifier === 'static') {
      return storage;
    }

    return new EncryptedStorage(storage, this.keyring, this.options.tmpDir);
  }

  /**
   * Cache-backed undecorated driver for `identifier`. Backs both
   * `getRawStorage()` and the inner storage `loadStorage()` wraps, so each
   * location has a single underlying driver instance.
   */
  private rawStorage(identifier: string): Storage {
    if (!this.rawStorageCache.has(identifier)) {
      this.rawStorageCache.set(identifier, this.createStorage(identifier));
    }

    const storage = this.rawStorageCache.get(identifier);
    /* c8 ignore next 3 */
    if (!storage) {
      throw new Error('Invalid storage');
    }

    return storage;
  }

  private createStorage(identifier: string): Storage {
    if (identifier === 'disk') {
      return new DiskStorage(this.options.uploadDir);
    }

    if (identifier === 'static') {
      return new StaticStorage();
    }

    if (identifier === 's3') {
      if (!this.options.s3) {
        throw new Error('S3 storage is not configured');
      }

      return new S3Storage({
        ...this.options.s3,
        tmpDir: this.options.tmpDir,
      });
    }

    throw new Error(`Unknown storage strategy ${identifier}`);
  }

  reset() {
    this.storageCache.clear();
    this.rawStorageCache.clear();
  }
}
