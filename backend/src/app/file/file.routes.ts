import { multipart, guard } from '#middlewares/index';
import { FileController } from './file.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import fileAccessGuard from './file.guard.js';
import { FileService } from '#app/file/file.service';
import { inject, injectable } from 'inversify';

@injectable()
export class FileRouter extends ModuleRouter {
  constructor(
    @inject(FileController) private readonly fileController: FileController,
    @inject(FileService) private readonly fileService: FileService,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('file', (_req, id) => {
      return this.fileService.getFileById(id);
    });
  }

  protected defineRoutes() {
    this.router.get(
      '/:fileId',
      guard(fileAccessGuard),
      controller(this.fileController, 'stream'),
    );
    this.router.post(
      '/',
      multipart('file'),
      controller(this.fileController, 'store'),
    );
  }
}
