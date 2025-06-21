import config from '#config/index';
import { DiskStorage } from '#core/storage/disk.storage';
import { StaticStorage } from '#core/storage/static.storage';
import type { Storage } from '#core/storage/storage';

export class StorageFactory {
  create(name?: string): Storage {
    name ??= config.storage.location;

    if (name === 'local') {
      return new DiskStorage(config.storage.uploadDir);
    }

    if (name === 'static') {
      return new StaticStorage();
    }

    throw new Error(`Unknown storage strategy ${name}`);
  }
}
