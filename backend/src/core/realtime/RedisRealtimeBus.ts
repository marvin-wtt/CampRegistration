import { EventEmitter } from 'node:events';
import { Redis } from 'ioredis';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import type { RealtimeBus, RealtimeListener } from '#core/realtime/RealtimeBus';
import config from '#config/index';
import logger from '#core/logger';

const CHANNEL_PREFIX = 'camp:';
const CHANNEL_SUFFIX = ':events';
const CHANNEL_PATTERN = `${CHANNEL_PREFIX}*${CHANNEL_SUFFIX}`;

const channelFor = (campId: string) =>
  `${CHANNEL_PREFIX}${campId}${CHANNEL_SUFFIX}`;

const campIdFromChannel = (channel: string): string =>
  channel.slice(CHANNEL_PREFIX.length, -CHANNEL_SUFFIX.length);

/**
 * Redis pub/sub realtime bus. Fans events out across backend instances: every
 * instance pattern-subscribes to `camp:*:events` and re-emits onto a local
 * {@link EventEmitter} that the per-camp listeners attach to.
 */
export class RedisRealtimeBus implements RealtimeBus {
  public readonly type = 'redis';

  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly emitter = new EventEmitter();

  constructor() {
    const connection = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      username: config.redis.username,
      db: config.redis.db,
    };

    this.publisher = new Redis(connection);
    this.subscriber = new Redis(connection);

    this.emitter.setMaxListeners(0);

    this.publisher.on('error', (err) => {
      logger.error('Realtime publisher error', err);
    });
    this.subscriber.on('error', (err) => {
      logger.error('Realtime subscriber error', err);
    });

    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        this.emitter.emit(campIdFromChannel(channel), event);
      } catch (err) {
        logger.error('Failed to parse realtime message', err);
      }
    });

    void this.subscriber.psubscribe(CHANNEL_PATTERN).catch((err: unknown) => {
      logger.error('Failed to subscribe to realtime channel', err);
    });
  }

  async publish(campId: string, event: RealtimeEvent): Promise<void> {
    await this.publisher.publish(channelFor(campId), JSON.stringify(event));
  }

  subscribe(campId: string, listener: RealtimeListener): () => void {
    this.emitter.on(campId, listener);
    return () => this.emitter.off(campId, listener);
  }

  async close(): Promise<void> {
    this.emitter.removeAllListeners();
    this.publisher.disconnect();
    this.subscriber.disconnect();
    await Promise.resolve();
  }
}
