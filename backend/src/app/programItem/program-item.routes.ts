import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { ProgramItemService } from './program-item.service.js';
import { ProgramItemController } from './program-item.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { inject, injectable } from 'inversify';

@injectable()
export class ProgramItemRouter extends ModuleRouter {
  constructor(
    @inject(ProgramItemService)
    private readonly programItemService: ProgramItemService,
    @inject(ProgramItemController)
    private readonly programItemController: ProgramItemController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('programItem', (req, id) => {
      const event = req.modelOrFail('event');
      return this.programItemService.getProgramItemById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.program_items.view')),
      controller(this.programItemController, 'index'),
    );
    this.router.get(
      '/:programItemId',
      guard(hasEventPermission('event.program_items.view')),
      controller(this.programItemController, 'show'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.program_items.create')),
      controller(this.programItemController, 'store'),
    );
    this.router.patch(
      '/:programItemId',
      guard(hasEventPermission('event.program_items.update')),
      controller(this.programItemController, 'update'),
    );
    this.router.delete(
      '/:programItemId',
      guard(hasEventPermission('event.program_items.delete')),
      controller(this.programItemController, 'destroy'),
    );
  }
}
