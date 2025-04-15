import config from '#config/index';
import { DiskStorage } from '#core/storage/disk.storage';

export class StaticStorage extends DiskStorage {
  constructor() {
    super(config.storage.staticDir);
  }

  moveToStorage(): Promise<void> {
    throw new Error('Static storage may not be accessed');
  }

  removeFile(): Promise<void> {
    throw new Error('Static storage may not be modified');
  }
}
