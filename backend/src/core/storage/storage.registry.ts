import type { Storage } from '#core/storage/storage';
import { DiskStorage } from '#core/storage/disk.storage';
import { StaticStorage } from '#core/storage/static.storage';
import type { StorageConfig } from '#config/index';

export class StorageRegistry {
  private storageCache: Map<string, Storage>;

  constructor(private options: StorageConfig) {
    this.storageCache = new Map();
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

  private loadStorage(identifier: string): Storage {
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
