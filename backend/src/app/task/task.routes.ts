import { auth, guard } from '#middlewares/index';
import { campManager } from '#app/campManager/camp-manager.guard';
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
      const camp = req.modelOrFail('camp');
      return this.taskService.getTaskById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.tasks.view')),
      controller(this.taskController, 'index'),
    );
    this.router.get(
      '/:taskId',
      guard(campManager('camp.tasks.view')),
      controller(this.taskController, 'show'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.tasks.create')),
      controller(this.taskController, 'store'),
    );
    this.router.patch(
      '/:taskId',
      guard(campManager('camp.tasks.update')),
      controller(this.taskController, 'update'),
    );
    this.router.delete(
      '/:taskId',
      guard(campManager('camp.tasks.delete')),
      controller(this.taskController, 'destroy'),
    );
  }
}
