import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import programPlannerService from './program-event.service.js';
import programEventController from './program-event.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController.js';

export class ProgramEventRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('programEvent', (req, id) => {
      const camp = req.modelOrFail('camp');
      return programPlannerService.getProgramEventById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.program_events.view')),
      controller(programEventController, 'index'),
    );
    this.router.get(
      '/:programEventId',
      guard(campManager('camp.program_events.view')),
      controller(programEventController, 'show'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.program_events.create')),
      controller(programEventController, 'store'),
    );
    this.router.put(
      '/:programEventId',
      guard(campManager('camp.program_events.update')),
      controller(programEventController, 'update'),
    );
    this.router.delete(
      '/:programEventId',
      guard(campManager('camp.program_events.delete')),
      controller(programEventController, 'destroy'),
    );
  }
}
