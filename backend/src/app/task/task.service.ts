import { BaseService } from '#core/base/BaseService';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';

/** The assignee is embedded in every task response — see `TaskResource`. */
const TASK_INCLUDE = {
  assignee: { include: { user: true, invitation: true } },
} as const;

interface TaskCreateDto {
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  assigneeId?: string | null;
}

interface TaskUpdateDto {
  title?: string;
  notes?: string | null;
  dueDate?: string | null;
  completed?: boolean;
  assigneeId?: string | null;
}

@injectable()
export class TaskService extends BaseService {
  constructor(
    @inject(EventManagerService)
    private readonly eventManagerService: EventManagerService,
  ) {
    super();
  }

  async getTaskById(eventId: string, id: string) {
    return this.prisma.task.findFirst({
      where: { id, eventId },
      include: TASK_INCLUDE,
    });
  }

  async queryTasks(eventId: string) {
    return this.prisma.task.findMany({
      where: { eventId },
      orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
      include: TASK_INCLUDE,
    });
  }

  async createTask(eventId: string, data: TaskCreateDto) {
    if (data.assigneeId) {
      await this.assertAssigneeBelongsToEvent(eventId, data.assigneeId);
    }

    return this.prisma.task.create({
      data: {
        eventId,
        title: data.title,
        notes: data.notes,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
      },
      include: TASK_INCLUDE,
    });
  }

  async updateTaskById(eventId: string, id: string, data: TaskUpdateDto) {
    if (data.assigneeId) {
      await this.assertAssigneeBelongsToEvent(eventId, data.assigneeId);
    }

    return this.prisma.task.update({
      where: { id },
      data,
      include: TASK_INCLUDE,
    });
  }

  async deleteTaskById(id: string) {
    await this.prisma.task.delete({ where: { id } });
  }

  private async assertAssigneeBelongsToEvent(
    eventId: string,
    assigneeId: string,
  ) {
    const manager = await this.eventManagerService.getManagerById(
      eventId,
      assigneeId,
    );

    if (manager === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid assignee id');
    }
  }
}
