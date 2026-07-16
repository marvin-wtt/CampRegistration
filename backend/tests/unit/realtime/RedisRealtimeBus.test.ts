import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import { RedisRealtimeBus } from '#core/realtime/RedisRealtimeBus';
import logger from '#core/logger';

interface MockRedisInstance extends EventEmitter {
  publish: ReturnType<typeof vi.fn>;
  psubscribe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

const { redisInstances, psubscribeRejection } = vi.hoisted(() => ({
  redisInstances: [] as MockRedisInstance[],
  psubscribeRejection: { current: null as Error | null },
}));

// The factory may only reference `vi`/`vi.hoisted()` values, not plain
// top-level imports — pull in `EventEmitter` dynamically instead.
vi.mock('ioredis', async () => {
  const { EventEmitter: MockEventEmitter } = await import('node:events');

  class MockRedis extends MockEventEmitter {
    publish = vi.fn().mockResolvedValue(1);
    psubscribe = vi.fn(() => {
      if (psubscribeRejection.current) {
        const err = psubscribeRejection.current;
        psubscribeRejection.current = null;
        return Promise.reject(err);
      }
      return Promise.resolve(1);
    });
    disconnect = vi.fn();

    constructor() {
      super();
      redisInstances.push(this as unknown as MockRedisInstance);
    }
  }

  return { Redis: MockRedis };
});

vi.mock('#core/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const event = (partial: Partial<RealtimeEvent> = {}): RealtimeEvent => ({
  resource: 'registration',
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  operation: 'updated',
  at: new Date().toISOString(),
  ...partial,
});

const publishFromOtherInstance = (
  channel: string,
  payload: RealtimeEvent | string,
) => {
  const [, subscriber] = redisInstances;
  const message =
    typeof payload === 'string' ? payload : JSON.stringify(payload);
  subscriber.emit('pmessage', 'camp:*:events', channel, message);
};

beforeEach(() => {
  redisInstances.length = 0;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('RedisRealtimeBus', () => {
  it('reports its type as redis', () => {
    const bus = new RedisRealtimeBus();

    expect(bus.type).toBe('redis');
  });

  it('pattern-subscribes to all camp channels on construction', () => {
    new RedisRealtimeBus();

    const [, subscriber] = redisInstances;
    expect(subscriber.psubscribe).toHaveBeenCalledWith('camp:*:events');
  });

  it('publishes a serialized event to the camp-scoped channel', async () => {
    const bus = new RedisRealtimeBus();
    const e = event();

    await bus.publish('camp-1', e);

    const [publisher] = redisInstances;
    expect(publisher.publish).toHaveBeenCalledWith(
      'camp:camp-1:events',
      JSON.stringify(e),
    );
  });

  it('delivers incoming pub/sub messages to local subscribers of the matching camp', () => {
    const bus = new RedisRealtimeBus();
    const received: RealtimeEvent[] = [];
    bus.subscribe('camp-a', (e) => received.push(e));

    const e = event({ id: 'reg-1' });
    publishFromOtherInstance('camp:camp-a:events', e);

    expect(received).toEqual([e]);
  });

  it('does not deliver messages published for a different camp', () => {
    const bus = new RedisRealtimeBus();
    const listener = vi.fn();
    bus.subscribe('camp-a', listener);

    publishFromOtherInstance('camp:camp-b:events', event());

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops delivery after unsubscribe', () => {
    const bus = new RedisRealtimeBus();
    const listener = vi.fn();

    const unsubscribe = bus.subscribe('camp-a', listener);
    unsubscribe();
    publishFromOtherInstance('camp:camp-a:events', event());

    expect(listener).not.toHaveBeenCalled();
  });

  it('logs and swallows malformed pub/sub messages instead of throwing', () => {
    const bus = new RedisRealtimeBus();
    const listener = vi.fn();
    bus.subscribe('camp-a', listener);

    expect(() =>
      publishFromOtherInstance('camp:camp-a:events', '{not-json'),
    ).not.toThrow();

    expect(listener).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to parse realtime message',
      expect.any(Error),
    );
  });

  it('logs publisher and subscriber connection errors', () => {
    new RedisRealtimeBus();
    const [publisher, subscriber] = redisInstances;

    publisher.emit('error', new Error('publisher down'));
    subscriber.emit('error', new Error('subscriber down'));

    expect(logger.error).toHaveBeenCalledWith(
      'Realtime publisher error',
      expect.any(Error),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Realtime subscriber error',
      expect.any(Error),
    );
  });

  it('logs a failure to subscribe to the realtime channel', async () => {
    const failure = new Error('connection refused');
    // The bus calls `.psubscribe()` on the subscriber client exactly once,
    // synchronously during construction — make that call reject.
    psubscribeRejection.current = failure;

    new RedisRealtimeBus();
    // Allow the rejected promise's .catch handler to run.
    await new Promise((resolve) => setImmediate(resolve));

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to subscribe to realtime channel',
      failure,
    );
  });

  it('close() removes local listeners and disconnects both clients', async () => {
    const bus = new RedisRealtimeBus();
    const listener = vi.fn();
    bus.subscribe('camp-a', listener);

    await bus.close();

    const [publisher, subscriber] = redisInstances;
    expect(publisher.disconnect).toHaveBeenCalled();
    expect(subscriber.disconnect).toHaveBeenCalled();

    publishFromOtherInstance('camp:camp-a:events', event());
    expect(listener).not.toHaveBeenCalled();
  });
});
