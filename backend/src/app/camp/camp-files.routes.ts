import { FileController } from '#app/file/file.controller';
import { FileService } from '#app/file/file.service';
import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class CampFilesRouter extends ModuleRouter {
  protected registerBindings() {
    const fileService = resolve(FileService);

    this.bindModel('file', (req, id) => {
      const camp = req.modelOrFail('camp');
      return fileService.getModelFile('camp', camp.id, id);
    });
  }

  protected defineRoutes() {
    const fileController = resolve(FileController);

    // This route is used to redirect to the file API endpoint
    // In the future, it should serve the file model instead
    this.router.get('/:fileId', (req, res) => {
      res.redirect('/api/v1/files/' + req.params.fileId);
    });

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.files.view')),
      controller(fileController, 'index'),
    );
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.files.create')),
      multipart('file'),
      controller(fileController, 'store'),
    );
    this.router.delete(
      '/:fileId',
      auth(),
      guard(campManager('camp.files.delete')),
      controller(fileController, 'destroy'),
    );
  }
}
