import { auth, guard } from '#middlewares/index';
import { and, or } from '#core/guard';
import { hasEventPermission } from '#app/event/event.guard';
import { choreFromBody } from './chore-assignment.middleware.js';
import { ChoreAssignmentController } from './chore-assignment.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { ChoreAssignmentService } from '#app/chore-assignment/chore-assignment.service';
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
    // Fixed paths must be registered before '/:choreAssignmentId' — otherwise
    // Express would match them as a (nonexistent) assignment id.
    this.router.get(
      '/suggestions',
      guard(hasEventPermission('event.chore_assignments.view')),
      controller(this.choreAssignmentController, 'suggestions'),
    );
    this.router.get(
      '/fairness',
      guard(hasEventPermission('event.chore_assignments.view')),
      controller(this.choreAssignmentController, 'fairness'),
    );
    this.router.get(
      '/rebalance',
      guard(hasEventPermission('event.chore_assignments.edit')),
      controller(this.choreAssignmentController, 'rebalancePreview'),
    );
    this.router.post(
      '/rebalance',
      guard(hasEventPermission('event.chore_assignments.edit')),
      controller(this.choreAssignmentController, 'rebalance'),
    );
    this.router.post(
      '/auto-fill',
      choreFromBody(),
      guard(hasEventPermission('event.chore_assignments.view')),
      controller(this.choreAssignmentController, 'autoFill'),
    );
    this.router.post(
      '/series',
      choreFromBody(),
      guard(
        and(
          hasEventPermission('event.chore_assignments.create'),
          // Replacing deletes the planned duties it replaces.
          or(
            (req) =>
              (req.body as { onConflict?: unknown }).onConflict !== 'REPLACE',
            hasEventPermission('event.chore_assignments.delete'),
          ),
        ),
      ),
      controller(this.choreAssignmentController, 'series'),
    );
    this.router.delete(
      '/members/:registrationId',
      guard(hasEventPermission('event.chore_assignments.edit')),
      controller(this.choreAssignmentController, 'destroyMember'),
    );
    this.router.post(
      '/',
      choreFromBody(),
      guard(hasEventPermission('event.chore_assignments.create')),
      controller(this.choreAssignmentController, 'store'),
    );
    this.router.delete(
      '/',
      guard(hasEventPermission('event.chore_assignments.delete')),
      controller(this.choreAssignmentController, 'destroyMany'),
    );
    this.router.get(
      '/:choreAssignmentId',
      guard(hasEventPermission('event.chore_assignments.view')),
      controller(this.choreAssignmentController, 'show'),
    );
    this.router.post(
      '/:choreAssignmentId/fill',
      guard(hasEventPermission('event.chore_assignments.edit')),
      controller(this.choreAssignmentController, 'fill'),
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
