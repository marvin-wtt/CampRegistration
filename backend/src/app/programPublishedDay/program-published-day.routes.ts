import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { ProgramPublishedDayController } from './program-published-day.controller.js';
import { inject, injectable } from 'inversify';

@injectable()
export class ProgramPublishedDayRouter extends ModuleRouter {
  constructor(
    @inject(ProgramPublishedDayController)
    private readonly programPublishedDayController: ProgramPublishedDayController,
  ) {
    super();
  }

  protected registerBindings() {
    // No bindings of its own: the `event` model is already bound globally for
    // `:eventId` by `EventRouter`.
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.program_items.view')),
      controller(this.programPublishedDayController, 'index'),
    );
    this.router.patch(
      '/',
      guard(hasEventPermission('event.program_items.update')),
      controller(this.programPublishedDayController, 'bulkPublish'),
    );
    this.router.put(
      '/:date',
      guard(hasEventPermission('event.program_items.update')),
      controller(this.programPublishedDayController, 'update'),
    );
    this.router.delete(
      '/:date',
      guard(hasEventPermission('event.program_items.update')),
      controller(this.programPublishedDayController, 'destroy'),
    );
  }
}
