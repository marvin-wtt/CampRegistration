import { multipart } from '#middlewares/index';
import fileController from './file.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';

export class FileRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for file routes
  }

  protected defineRoutes() {
    this.router.post(
      '/',
      multipart('file'),
      controller(fileController, 'store'),
    );
  }
}
