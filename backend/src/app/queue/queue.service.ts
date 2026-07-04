import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import moment from 'moment';
import { QueueManager } from '#core/queue/QueueManager';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#utils/ApiError';
import type { QueueInfo } from '@camp-registration/common/entities';

@injectable()
export class QueueService extends BaseService {
  constructor(
    @inject(QueueManager) private readonly queueManager: QueueManager,
  ) {
    super();
  }

  async listQueues(): Promise<QueueInfo[]> {
    return Promise.all(
      this.queueManager.all().map(async (queue) => ({
        name: queue.name,
        counts: await queue.jobCounts(),
      })),
    );
  }

  async retryFailed(name: string): Promise<void> {
    const queue = this.queueManager.get(name);
    if (!queue) {
      throw new ApiError(httpStatus.NOT_FOUND, `Queue '${name}' not found`);
    }
    await queue.retryFailed();
  }

  async deleteFailed(name: string): Promise<void> {
    const queue = this.queueManager.get(name);
    if (!queue) {
      throw new ApiError(httpStatus.NOT_FOUND, `Queue '${name}' not found`);
    }
    await queue.deleteFailed();
  }

  /** Prunes old terminal job records: completed >30d and failed >90d ago. */
  async deleteOldJobs(): Promise<{ completed: number; failed: number }> {
    const completed = await this.deleteCompletedJobs();
    const failed = await this.deleteFailedJobs();

    return { completed, failed };
  }

  private async deleteCompletedJobs(): Promise<number> {
    const { count } = await this.prisma.job.deleteMany({
      where: {
        status: 'COMPLETED',
        finishedAt: {
          lt: moment().subtract(30, 'days').toDate(),
        },
      },
    });

    return count;
  }

  private async deleteFailedJobs(): Promise<number> {
    const { count } = await this.prisma.job.deleteMany({
      where: {
        status: 'FAILED',
        finishedAt: {
          lt: moment().subtract(90, 'days').toDate(),
        },
      },
    });

    return count;
  }
}
