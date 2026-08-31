import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { DutyController } from './duty.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { DutyService } from '#app/duty/duty.service';
import { inject, injectable } from 'inversify';

@injectable()
export class DutyRouter extends ModuleRouter {
  constructor(
    @inject(DutyController) private readonly dutyController: DutyController,
    @inject(DutyService) private readonly dutyService: DutyService,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('duty', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return this.dutyService.getDutyById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.duties.view')),
      controller(this.dutyController, 'index'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.duties.create')),
      controller(this.dutyController, 'store'),
    );
    this.router.get(
      '/:dutyId',
      guard(hasEventPermission('event.duties.view')),
      controller(this.dutyController, 'show'),
    );
    this.router.patch(
      '/:dutyId',
      guard(hasEventPermission('event.duties.edit')),
      controller(this.dutyController, 'update'),
    );
    this.router.delete(
      '/:dutyId',
      guard(hasEventPermission('event.duties.delete')),
      controller(this.dutyController, 'destroy'),
    );
  }
}
