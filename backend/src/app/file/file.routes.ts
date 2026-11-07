import multipart from '#core/storage/multipart.middleware';
import { guard } from '#core/guard';
import { FileController } from './file.controller.js';
import { controller } from '#core/router/bindController';
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
      guard(fileAccessGuard('view')),
      controller(this.fileController, 'stream'),
    );
    this.router.post(
      '/',
      multipart('file'),
      controller(this.fileController, 'store'),
    );
    this.router.patch(
      '/:fileId',
      guard(fileAccessGuard('edit')),
      controller(this.fileController, 'update'),
    );
    this.router.delete(
      '/:fileId',
      guard(fileAccessGuard('delete')),
      controller(this.fileController, 'destroy'),
    );
  }
}
