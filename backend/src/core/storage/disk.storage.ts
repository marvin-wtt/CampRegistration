import type { Storage } from '#core/storage/storage.js';
import fse from 'fs-extra';
import config from '#config/index.js';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import type { File } from '@prisma/client';
import path from 'path';

export class DiskStorage implements Storage {
  constructor(private storageDir: string) {}

  private isDirectoryPathValid(filePath: string, rootPath: string): boolean {
    // Make sure, that the file path does not escape the root path
    const resolvedFilePath = path.resolve(filePath);
    const resolvedRootPath = path.resolve(rootPath);

    return resolvedFilePath.startsWith(resolvedRootPath);
  }

  private safeJoinFilePath(rootPath: string, filename: string): string {
    const filePath = path.join(rootPath, filename);

    if (!this.isDirectoryPathValid(filePath, rootPath)) {
      throw new Error('Invalid file');
    }

    return filePath;
  }

  async removeFile(fileName: string) {
    const filePath = this.safeJoinFilePath(this.storageDir, fileName);

    await fse.remove(filePath);
  }

  async moveToStorage(filename: string) {
    const sourcePath = this.safeJoinFilePath(config.storage.tmpDir, filename);
    const destinationPath = this.safeJoinFilePath(this.storageDir, filename);

    await fse.ensureDir(this.storageDir);
    await fse.move(sourcePath, destinationPath, {
      overwrite: false,
    });
  }

  getFileNames(): Promise<string[]> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fse.readdir(this.storageDir);
  }

  stream(file: File) {
    const filePath = this.safeJoinFilePath(this.storageDir, file.name);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fse.existsSync(filePath)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'File is missing in storage.');
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fse.createReadStream(filePath);
  }
}
