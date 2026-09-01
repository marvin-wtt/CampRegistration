import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { ChoreController } from './chore.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { ChoreService } from '#app/chore/chore.service';
import { inject, injectable } from 'inversify';

@injectable()
export class ChoreRouter extends ModuleRouter {
  constructor(
    @inject(ChoreController) private readonly choreController: ChoreController,
    @inject(ChoreService) private readonly choreService: ChoreService,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('chore', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return this.choreService.getChoreById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.chores.view')),
      controller(this.choreController, 'index'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.chores.create')),
      controller(this.choreController, 'store'),
    );
    this.router.get(
      '/:choreId',
      guard(hasEventPermission('event.chores.view')),
      controller(this.choreController, 'show'),
    );
    this.router.patch(
      '/:choreId',
      guard(hasEventPermission('event.chores.edit')),
      controller(this.choreController, 'update'),
    );
    this.router.delete(
      '/:choreId',
      guard(hasEventPermission('event.chores.delete')),
      controller(this.choreController, 'destroy'),
    );
  }
}
