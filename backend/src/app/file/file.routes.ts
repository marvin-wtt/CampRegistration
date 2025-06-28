import { multipart, guard } from '#middlewares/index';
import fileController from './file.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import fileAccessGuard from './file.guard.js';
import fileService from '#app/file/file.service.js';

export class FileRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('file', (_req, id) => fileService.getFileById(id));
  }

  protected defineRoutes() {
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
