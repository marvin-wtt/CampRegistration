import { inject, injectable } from 'inversify';
import { QueueManager } from '#core/queue/QueueManager';
import { BaseService } from '#core/base/BaseService';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  checks: {
    database: 'ok' | 'error';
    queues?: Record<string, QueueCheckResult>;
  };
}

export type QueueCheckResult =
  | { active: number; failed: number; pending: number; delayed: number }
  | 'error';

@injectable()
export class HealthService extends BaseService {
  constructor(
    @inject(QueueManager) private readonly queueManager: QueueManager,
  ) {
    super();
  }

  async check(): Promise<HealthStatus> {
    let healthy = true;

    const databaseStatus = await this.checkDatabase();
    if (databaseStatus === 'error') {
      healthy = false;
    }

    const queues = this.queueManager.all();
    const queueStatuses = await this.checkQueues(queues);
    if (Object.values(queueStatuses).some((s) => s === 'error')) {
      healthy = false;
    }

    return {
      status: healthy ? 'ok' : 'degraded',
      checks: {
        database: databaseStatus,
        ...(queues.length > 0 && { queues: queueStatuses }),
      },
    };
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkQueues(
    queues: ReturnType<QueueManager['all']>,
  ): Promise<Record<string, QueueCheckResult>> {
    const results = await Promise.all(
      queues.map(async (queue) => {
        try {
          return [queue.name, await queue.jobCounts()] as const;
        } catch {
          return [queue.name, 'error' as const] as const;
        }
      }),
    );

    return Object.fromEntries(results) as Record<string, QueueCheckResult>;
  }
}
