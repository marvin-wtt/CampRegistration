import { auth, guard } from '#middlewares/index';
import userController from './user.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import userService from '#app/user/user.service';

export class UserRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('user', (_req, id) => userService.getUserById(id));
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get('/', auth(), guard(), controller(userController, 'index'));
    this.router.get(
      '/:userId',
      auth(),
      guard(),
      controller(userController, 'show'),
    );
    this.router.post('/', auth(), guard(), controller(userController, 'store'));
    this.router.patch(
      '/:userId',
      auth(),
      guard(),
      controller(userController, 'update'),
    );
    this.router.delete(
      '/:userId',
      auth(),
      guard(),
      controller(userController, 'destroy'),
    );
  }
}
