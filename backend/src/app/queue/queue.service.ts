import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import { QueueManager } from '#core/queue/QueueManager';
import type { PrunedJobs } from '#core/queue/Queue';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
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

  async countFailedJobs(): Promise<number> {
    const queues = await this.listQueues();

    return queues.reduce((sum, queue) => sum + queue.counts.failed, 0);
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

  async deleteOldJobs(): Promise<PrunedJobs> {
    return this.queueManager.prune();
  }
}
