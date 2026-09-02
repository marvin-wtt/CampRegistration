import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { choreFromBody } from './choreAssignment.middleware.js';
import { ChoreAssignmentController } from './choreAssignment.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { ChoreAssignmentService } from '#app/choreAssignment/choreAssignment.service';
import { inject, injectable } from 'inversify';

@injectable()
export class ChoreAssignmentRouter extends ModuleRouter {
  constructor(
    @inject(ChoreAssignmentController)
    private readonly choreAssignmentController: ChoreAssignmentController,
    @inject(ChoreAssignmentService)
    private readonly choreAssignmentService: ChoreAssignmentService,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('choreAssignment', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return this.choreAssignmentService.getChoreAssignmentById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.chore_assignments.view')),
      controller(this.choreAssignmentController, 'index'),
    );
    // Must be registered before '/:choreAssignmentId' — otherwise Express would
    // match this path as a (nonexistent) assignment id.
    this.router.get(
      '/suggestions',
      guard(hasEventPermission('event.chore_assignments.view')),
      controller(this.choreAssignmentController, 'suggestions'),
    );
    this.router.post(
      '/',
      choreFromBody(),
      guard(hasEventPermission('event.chore_assignments.create')),
      controller(this.choreAssignmentController, 'store'),
    );
    this.router.get(
      '/:choreAssignmentId',
      guard(hasEventPermission('event.chore_assignments.view')),
      controller(this.choreAssignmentController, 'show'),
    );
    this.router.patch(
      '/:choreAssignmentId',
      guard(hasEventPermission('event.chore_assignments.edit')),
      controller(this.choreAssignmentController, 'update'),
    );
    this.router.delete(
      '/:choreAssignmentId',
      guard(hasEventPermission('event.chore_assignments.delete')),
      controller(this.choreAssignmentController, 'destroy'),
    );
  }
}
