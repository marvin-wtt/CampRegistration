import { inject, injectable } from 'inversify';
import { QueueManager } from '#core/queue/QueueManager';
import { BaseService } from '#core/base/BaseService';
import v8 from 'v8';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  checks: {
    database: 'ok' | 'error';
    queues?: Record<string, QueueCheckResult>;
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    heapLimitMb: number;
    externalMb: number;
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

    const memory = this.getMemoryUsage();

    return {
      status: healthy ? 'ok' : 'degraded',
      checks: {
        database: databaseStatus,
        ...(queues.length > 0 && { queues: queueStatuses }),
      },
      memory,
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

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    const heapLimit = v8.getHeapStatistics().heap_size_limit;
    const BYTE_TO_MB = 1024 * 1024;

    return {
      rssMb: usage.rss / BYTE_TO_MB,
      heapUsedMb: usage.heapUsed / BYTE_TO_MB,
      heapTotalMb: usage.heapTotal / BYTE_TO_MB,
      heapLimitMb: heapLimit / BYTE_TO_MB,
      externalMb: usage.external / BYTE_TO_MB,
    };
  }
}
