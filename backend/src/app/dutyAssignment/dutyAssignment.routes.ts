import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { DutyAssignmentController } from './dutyAssignment.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { DutyAssignmentService } from '#app/dutyAssignment/dutyAssignment.service';
import { inject, injectable } from 'inversify';

@injectable()
export class DutyAssignmentRouter extends ModuleRouter {
  constructor(
    @inject(DutyAssignmentController)
    private readonly dutyAssignmentController: DutyAssignmentController,
    @inject(DutyAssignmentService)
    private readonly dutyAssignmentService: DutyAssignmentService,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('dutyAssignment', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return this.dutyAssignmentService.getDutyAssignmentById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.duty_assignments.view')),
      controller(this.dutyAssignmentController, 'index'),
    );
    // Must be registered before '/:dutyAssignmentId' — otherwise Express would
    // match this path as a (nonexistent) assignment id.
    this.router.get(
      '/suggestions',
      guard(hasEventPermission('event.duty_assignments.view')),
      controller(this.dutyAssignmentController, 'suggestions'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.duty_assignments.create')),
      controller(this.dutyAssignmentController, 'store'),
    );
    this.router.get(
      '/:dutyAssignmentId',
      guard(hasEventPermission('event.duty_assignments.view')),
      controller(this.dutyAssignmentController, 'show'),
    );
    this.router.patch(
      '/:dutyAssignmentId',
      guard(hasEventPermission('event.duty_assignments.edit')),
      controller(this.dutyAssignmentController, 'update'),
    );
    this.router.delete(
      '/:dutyAssignmentId',
      guard(hasEventPermission('event.duty_assignments.delete')),
      controller(this.dutyAssignmentController, 'destroy'),
    );
  }
}
