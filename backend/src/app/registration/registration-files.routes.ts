import { ModuleRouter } from '#core/router/ModuleRouter';

export class RegistrationFilesRouter extends ModuleRouter {
  constructor() {
    super(false);
  }

  protected registerBindings() {
    /* empty */
  }

  protected defineRoutes() {
    // This route is used to redirect to the file API endpoint
    // In the future, it should serve the file model instead or be removed
    this.router.get('/:fileId', (req, res) => {
      res.redirect('/api/v1/files/' + req.params.fileId);
    });
  }
}
