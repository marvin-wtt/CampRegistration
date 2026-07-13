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
   * manages ciphertext directly, such as the file-encryption migration
   * script, so it can write a blob's bytes as-is on any driver (disk today,
   * s3 later) without `EncryptedStorage` re-encrypting (or refusing to
   * decrypt) on top.
   */
  getRawStorage(identifier?: string): Storage {
    identifier ??= this.options.location;

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
    const storage = this.createStorage(identifier);

    // Static assets are public and served plaintext. Every upload store
    // (local today, s3 later) goes through EncryptedStorage even without a
    // configured key: it then stores plaintext but refuses to serve
    // previously encrypted files as raw ciphertext.
    if (identifier === 'static') {
      return storage;
    }

    return new EncryptedStorage(storage, this.keyring, this.options.tmpDir);
  }

  private createStorage(identifier: string): Storage {
    if (identifier === 'local') {
      return new DiskStorage(this.options.uploadDir);
    }

    if (identifier === 'static') {
      return new StaticStorage();
    }

    throw new Error(`Unknown storage strategy ${identifier}`);
  }

  reset() {
    this.storageCache.clear();
  }
}
