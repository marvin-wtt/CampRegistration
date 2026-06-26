import { ModuleRouter } from '#core/router/ModuleRouter';
import { CampController } from '#app/camp/camp.controller';
import { CampService } from './camp.service.js';
import { auth, guard } from '#middlewares/index';
import { campManager } from '#app/campManager/camp-manager.guard';
import type { CampQuery } from '@camp-registration/common/entities';
import { controller } from '#utils/bindController';
import { realtimeStream } from '#app/realtime/realtime.stream';
import { resolve } from '#core/ioc/container';

export class CampRouter extends ModuleRouter {
  protected registerBindings() {
    const campService = resolve(CampService);
    this.bindModel('camp', (_req, id) => campService.getCampById(id));
  }

  protected defineRoutes() {
    const campController: CampController = resolve(CampController);

    this.router.get(
      '/',
      guard((req) => {
        const view = (req.query as CampQuery).view;
        return view !== 'all' && (view !== 'assigned' || req.isAuthenticated());
      }),
      controller(campController, 'index'),
    );

    this.router.get('/:campId', controller(campController, 'show'));

    // Ambient live-updates stream for the camp. Also carries registration
    // events, since anyone who can view the camp can view its registrations.
    this.router.get(
      '/:campId/events',
      auth(),
      guard(campManager('camp.view')),
      realtimeStream('camp', 'registration'),
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
