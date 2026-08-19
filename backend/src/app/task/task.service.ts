import { BaseService } from '#core/base/BaseService';
import { CampManagerService } from '#app/campManager/camp-manager.service';
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
    @inject(CampManagerService)
    private readonly campManagerService: CampManagerService,
  ) {
    super();
  }

  async getTaskById(campId: string, id: string) {
    return this.prisma.task.findFirst({
      where: { id, campId },
      include: TASK_INCLUDE,
    });
  }

  async queryTasks(campId: string) {
    return this.prisma.task.findMany({
      where: { campId },
      orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
      include: TASK_INCLUDE,
    });
  }

  async createTask(campId: string, data: TaskCreateDto) {
    if (data.assigneeId) {
      await this.assertAssigneeBelongsToCamp(campId, data.assigneeId);
    }

    return this.prisma.task.create({
      data: {
        campId,
        title: data.title,
        notes: data.notes,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
      },
      include: TASK_INCLUDE,
    });
  }

  async updateTaskById(campId: string, id: string, data: TaskUpdateDto) {
    if (data.assigneeId) {
      await this.assertAssigneeBelongsToCamp(campId, data.assigneeId);
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

  private async assertAssigneeBelongsToCamp(
    campId: string,
    assigneeId: string,
  ) {
    const manager = await this.campManagerService.getManagerById(
      campId,
      assigneeId,
    );

    if (manager === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid assignee id');
    }
  }
}
