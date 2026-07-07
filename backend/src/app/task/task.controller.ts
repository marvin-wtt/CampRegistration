import httpStatus from 'http-status';
import { TaskService } from './task.service.js';
import { TaskResource } from './task.resource.js';
import { BaseController } from '#core/base/BaseController';
import type { Request, Response } from 'express';
import validator from '#app/task/task.validation';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

@injectable()
export class TaskController extends BaseController {
  constructor(
    @inject(TaskService)
    private readonly taskService: TaskService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const task = req.modelOrFail('task');

    res.resource(new TaskResource(task));
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const camp = req.modelOrFail('camp');

    const tasks = await this.taskService.queryTasks(camp.id);

    res.resource(TaskResource.collection(tasks));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const camp = req.modelOrFail('camp');

    const task = await this.taskService.createTask(camp.id, {
      title: body.title,
      notes: body.notes ?? undefined,
      dueDate: body.dueDate ?? undefined,
      assigneeId: body.assigneeId ?? undefined,
    });

    void this.realtimeService.emit(camp.id, 'task', task.id, 'created');

    res.status(httpStatus.CREATED).resource(new TaskResource(task));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const camp = req.modelOrFail('camp');
    const existingTask = req.modelOrFail('task');

    const task = await this.taskService.updateTaskById(
      camp.id,
      existingTask.id,
      {
        title: body.title,
        notes: body.notes,
        dueDate: body.dueDate,
        completed: body.completed,
        assigneeId: body.assigneeId,
      },
    );

    void this.realtimeService.emit(camp.id, 'task', task.id, 'updated');

    res.resource(new TaskResource(task));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const camp = req.modelOrFail('camp');
    const task = req.modelOrFail('task');

    await this.taskService.deleteTaskById(task.id);

    void this.realtimeService.emit(camp.id, 'task', task.id, 'deleted');

    res.status(httpStatus.NO_CONTENT).send();
  }
}
