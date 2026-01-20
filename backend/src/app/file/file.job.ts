import type { AppJob } from '#core/base/AppJob';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';

@injectable()
export class CleanUnassignedFilesJob implements AppJob {
  name = 'files:clean-unassigned';
  pattern = '0 * * * *'; // Every hour

  constructor(@inject(FileService) private readonly fileService: FileService) {}

  async run(): Promise<void> {
    await this.fileService.deleteUnassignedFiles();
  }
}

@injectable()
export class CleanTempFilesJob implements AppJob {
  name = 'files:clean-tmp';
  pattern = '0 4 * * *'; // Every day at 4 AM

  constructor(@inject(FileService) private readonly fileService: FileService) {}

  async run(): Promise<void> {
    await this.fileService.deleteTempFiles();
  }
}

@injectable()
export class CleanUnusedFilesJob implements AppJob {
  name = 'files:clean-unused';
  pattern = '0 3 * * *'; // Every day at 3 AM

  constructor(@inject(FileService) private readonly fileService: FileService) {}

  async run(): Promise<void> {
    await this.fileService.deleteUnreferencedFiles();
  }
}
