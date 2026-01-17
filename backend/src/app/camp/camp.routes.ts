import { ModuleRouter } from '#core/router/ModuleRouter';
import { CampController } from '#app/camp/camp.controller';
import { CampService } from './camp.service.js';
import { auth, guard } from '#middlewares/index';
import { or, campActive, campManager } from '#guards/index';
import type { CampQuery } from '@camp-registration/common/entities';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';

export class CampRouter extends ModuleRouter {
  protected registerBindings() {
    const campService = resolve(CampService);
    this.bindModel('camp', (_req, id) => campService.getCampById(id));
  }

  protected defineRoutes() {
    const campController = new CampController();

    this.router.get(
      '/',
      guard((req) => (req.query as CampQuery).showAll === undefined),
      controller(campController, 'index'),
    );

    this.router.get(
      '/:campId',
      guard(or(campManager('camp.view'), campActive)),
      controller(campController, 'show'),
    );

    this.router.post('/', auth(), controller(campController, 'store'));

    this.router.patch(
      '/:campId',
      auth(),
      guard(campManager('camp.edit')),
      controller(campController, 'update'),
    );

    this.router.delete(
      '/:campId',
      auth(),
      guard(campManager('camp.delete')),
      controller(campController, 'destroy'),
    );
  }
}
