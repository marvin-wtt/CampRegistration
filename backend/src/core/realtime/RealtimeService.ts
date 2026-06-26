import { injectable } from 'inversify';
import type {
  RealtimeEvent,
  RealtimeOperation,
  RealtimeResource,
} from '@camp-registration/common/realtime';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';
import type { RealtimeBus, RealtimeListener } from '#core/realtime/RealtimeBus';
import { MemoryRealtimeBus } from '#core/realtime/MemoryRealtimeBus';
import { RedisRealtimeBus } from '#core/realtime/RedisRealtimeBus';
import { Config } from '#core/ioc/decorators';
import type { AppConfig } from '#config';
import logger from '#core/logger';

@injectable()
export class RealtimeService {
  private readonly bus: RealtimeBus;

  public constructor(@Config() config: AppConfig) {
    // Mirror QueueManager: a Redis-backed queue implies a multi-instance
    // deployment, where realtime must fan out across processes too. Otherwise
    // the in-memory bus is sufficient (single instance / dev).
    this.bus =
      config.queue.driver === 'redis'
        ? new RedisRealtimeBus()
        : new MemoryRealtimeBus();

    logger.info(`Using ${this.bus.type} realtime bus`);
  }

  /**
   * Publish an invalidation event for a resource change within a camp.
   *
   * Best-effort: the triggering action has already committed, so a failure to
   * notify must never fail the caller. Errors are logged and swallowed.
   */
  async emit(
    campId: string,
    resource: RealtimeResource,
    id: string,
    operation: RealtimeOperation,
    origin?: string,
  ): Promise<void> {
    const event: RealtimeEvent = {
      resource,
      id,
      operation,
      requiredPermission: RESOURCE_VIEW_PERMISSION[resource],
      origin,
      at: new Date().toISOString(),
    };

    try {
      await this.bus.publish(campId, event);
    } catch (err) {
      logger.error('Failed to emit realtime event', err);
    }
  }

  /** Subscribe to a camp's events. Returns an unsubscribe function. */
  subscribe(campId: string, listener: RealtimeListener): () => void {
    return this.bus.subscribe(campId, listener);
  }

  async shutdown(): Promise<void> {
    await this.bus.close();
  }
}
