import type {
  Storage,
  StorageFile,
  StorageMoveFile,
} from '#core/storage/storage';
import fse from 'fs-extra';
import config from '#config/index';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { safeJoinFilePath } from '#core/storage/safe-path';

export class DiskStorage implements Storage {
  constructor(private readonly storageDir: string) {
    fse.ensureDirSync(this.storageDir);
  }

  async removeFile(fileName: string) {
    const filePath = safeJoinFilePath(this.storageDir, fileName);

    await fse.remove(filePath);
  }

  async moveToStorage(file: StorageMoveFile, sourceFileName?: string) {
    const sourcePath = safeJoinFilePath(
      config.storage.tmpDir,
      sourceFileName ?? file.name,
    );
    const destinationPath = safeJoinFilePath(this.storageDir, file.name);

    await fse.ensureDir(this.storageDir);
    await fse.move(sourcePath, destinationPath, {
      overwrite: false,
    });
  }

  getFileNames(): Promise<string[]> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fse.readdir(this.storageDir);
  }

  openReadStream(file: StorageFile) {
    const filePath = safeJoinFilePath(this.storageDir, file.name);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fse.existsSync(filePath)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'File is missing in storage.');
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return Promise.resolve(fse.createReadStream(filePath));
  }
}
