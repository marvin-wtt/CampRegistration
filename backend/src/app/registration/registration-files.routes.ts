import { FileService } from '#app/file/file.service';
import { ModuleRouter } from '#core/router/ModuleRouter.js';
import { resolve } from '#core/ioc/container.js';

export class RegistrationFilesRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('file', (req, id) => {
      const fileService = resolve(FileService);
      const registration = req.modelOrFail('registration');
      return fileService.getModelFile('registration', registration.id, id);
    });
  }

  protected defineRoutes() {
    // This route is used to redirect to the file API endpoint
    // In the future, it should serve the file model instead or be removed
    this.router.get('/:fileId', (req, res) => {
      res.redirect('/api/v1/files/' + req.params.fileId);
    });
  }
}
