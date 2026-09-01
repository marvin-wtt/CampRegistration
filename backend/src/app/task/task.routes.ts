import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { TaskService } from './task.service.js';
import { TaskController } from './task.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { inject, injectable } from 'inversify';

@injectable()
export class TaskRouter extends ModuleRouter {
  constructor(
    @inject(TaskService)
    private readonly taskService: TaskService,
    @inject(TaskController)
    private readonly taskController: TaskController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('task', (req, id) => {
      const event = req.modelOrFail('event');
      return this.taskService.getTaskById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.tasks.view')),
      controller(this.taskController, 'index'),
    );
    this.router.get(
      '/:taskId',
      guard(hasEventPermission('event.tasks.view')),
      controller(this.taskController, 'show'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.tasks.create')),
      controller(this.taskController, 'store'),
    );
    this.router.patch(
      '/:taskId',
      guard(hasEventPermission('event.tasks.update')),
      controller(this.taskController, 'update'),
    );
    this.router.delete(
      '/:taskId',
      guard(hasEventPermission('event.tasks.delete')),
      controller(this.taskController, 'destroy'),
    );
  }
}
