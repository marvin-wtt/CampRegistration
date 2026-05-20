import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import { QueueManager } from '#core/queue/QueueManager';
import ApiError from '#utils/ApiError';
import type { QueueInfo } from '@camp-registration/common/entities';

@injectable()
export class QueueService {
  constructor(
    @inject(QueueManager) private readonly queueManager: QueueManager,
  ) {}

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
}
