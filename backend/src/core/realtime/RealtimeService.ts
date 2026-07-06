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
    // `config.realtime.driver` defaults to redis when the queue driver is
    // redis (multi-instance deployment) and memory otherwise; REALTIME_DRIVER
    // overrides (e.g. multi-instance with the database queue driver).
    this.bus =
      config.realtime.driver === 'redis'
        ? new RedisRealtimeBus()
        : new MemoryRealtimeBus();

    logger.info(`Using ${this.bus.type} realtime bus`);
  }

  /** The active bus driver (diagnostics). */
  get busType(): string {
    return this.bus.type;
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
    operation: Exclude<RealtimeOperation, 'invalidated'>,
    origin?: string,
  ): Promise<void> {
    await this.publish(campId, { resource, id, operation, origin });
  }

  /**
   * Publish a collection-level invalidation for a resource within a camp:
   * "something about this collection changed — refetch the list". Used for
   * bulk operations where per-entity events would trigger a refetch stampede.
   */
  async emitInvalidation(
    campId: string,
    resource: RealtimeResource,
    origin?: string,
  ): Promise<void> {
    await this.publish(campId, {
      resource,
      id: null,
      operation: 'invalidated',
      origin,
    });
  }

  private async publish(
    campId: string,
    event: Pick<RealtimeEvent, 'resource' | 'id' | 'operation' | 'origin'>,
  ): Promise<void> {
    try {
      await this.bus.publish(campId, {
        ...event,
        requiredPermission: RESOURCE_VIEW_PERMISSION[event.resource],
        at: new Date().toISOString(),
      });
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
