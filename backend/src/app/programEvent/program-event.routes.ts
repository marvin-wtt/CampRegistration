import { auth, guard } from '#middlewares/index';
import { campManager } from '#app/campManager/camp-manager.guard';
import { ProgramEventService } from './program-event.service.js';
import { ProgramEventController } from './program-event.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { inject, injectable } from 'inversify';

@injectable()
export class ProgramEventRouter extends ModuleRouter {
  constructor(
    @inject(ProgramEventService)
    private readonly programEventService: ProgramEventService,
    @inject(ProgramEventController)
    private readonly programEventController: ProgramEventController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('programEvent', (req, id) => {
      const camp = req.modelOrFail('camp');
      return this.programEventService.getProgramEventById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.program_events.view')),
      controller(this.programEventController, 'index'),
    );
    this.router.get(
      '/:programEventId',
      guard(campManager('camp.program_events.view')),
      controller(this.programEventController, 'show'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.program_events.create')),
      controller(this.programEventController, 'store'),
    );
    this.router.patch(
      '/:programEventId',
      guard(campManager('camp.program_events.update')),
      controller(this.programEventController, 'update'),
    );
    this.router.delete(
      '/:programEventId',
      guard(campManager('camp.program_events.delete')),
      controller(this.programEventController, 'destroy'),
    );
  }
}
