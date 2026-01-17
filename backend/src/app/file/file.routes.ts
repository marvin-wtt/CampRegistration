import { multipart, guard } from '#middlewares/index';
import { FileController } from './file.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import fileAccessGuard from './file.guard.js';
import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';

export class FileRouter extends ModuleRouter {
  private fileService: FileService;

  constructor() {
    super();

    this.fileService = resolve(FileService);
  }

  protected registerBindings() {
    this.bindModel('file', (_req, id) => this.fileService.getFileById(id));
  }

  protected defineRoutes() {
    const fileController = resolve(FileController);

    this.router.get(
      '/:fileId',
      guard(fileAccessGuard),
      controller(fileController, 'stream'),
    );
    this.router.post(
      '/',
      multipart('file'),
      controller(fileController, 'store'),
    );
  }
}
