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

  async moveToStorage(file: StorageMoveFile) {
    const sourcePath = safeJoinFilePath(
      config.storage.tmpDir,
      file.tmpFileName,
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

  // Opened before returning: a file moved away in between (a tmp upload taken
  // into storage) is then a NOT_FOUND here, not a later stream error. Once
  // open, the stream reads it to the end even if it is moved.
  async openReadStream(file: StorageFile) {
    const filePath = safeJoinFilePath(this.storageDir, file.name);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const handle = await fse.promises.open(filePath, 'r');
      return handle.createReadStream();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ApiError(httpStatus.NOT_FOUND, 'File is missing in storage.');
      }
      throw error;
    }
  }
}
