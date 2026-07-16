import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import type { Permission } from '@camp-registration/common/permissions';
import * as container from '#core/ioc/container';
import {
  realtimeStream,
  type RealtimeSubscriber,
} from '#app/realtime/realtime.stream';

vi.mock('#core/logger', () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const logger = (await import('#core/logger')).default;

const HEARTBEAT_INTERVAL_MS = 25_000;

/** Stands in for `RealtimeService`; only `subscribe` is used by the handler. */
class FakeRealtimeService {
  private readonly emitter = new EventEmitter();

  subscribe(
    campId: string,
    listener: (event: RealtimeEvent) => void,
  ): () => void {
    this.emitter.on(campId, listener);
    return () => this.emitter.off(campId, listener);
  }

  listenerCount(campId: string): number {
    return this.emitter.listenerCount(campId);
  }

  publish(campId: string, event: RealtimeEvent): void {
    this.emitter.emit(campId, event);
  }
}

let bus: FakeRealtimeService;

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const event = (partial: Partial<RealtimeEvent> = {}): RealtimeEvent => ({
  resource: 'registration',
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  operation: 'updated',
  at: new Date().toISOString(),
  ...partial,
});

const subscriber = (
  overrides: Partial<RealtimeSubscriber> = {},
): RealtimeSubscriber => ({
  managerId: 'manager-1',
  permissions: new Set<Permission>(['camp.view']),
  expiresAt: null,
  ...overrides,
});

const buildReq = (campId = 'camp-1') => {
  const handlers: Partial<Record<string, () => void>> = {};
  const req = {
    modelOrFail: () => ({ id: campId }),
    on: (eventName: string, cb: () => void) => {
      handlers[eventName] = cb;
    },
  } as unknown as Request;
  return { req, trigger: (eventName: string) => handlers[eventName]?.() };
};

const buildRes = () => {
  const writes: string[] = [];
  const res = {
    writableEnded: false,
    destroyed: false,
    writeHead: vi.fn(),
    write: vi.fn((chunk: string) => {
      writes.push(chunk);
      return true;
    }),
    flush: vi.fn(),
    end: vi.fn(function (this: { writableEnded: boolean }) {
      this.writableEnded = true;
    }),
  };
  return { res: res as unknown as Response, writes, raw: res };
};

beforeEach(() => {
  bus = new FakeRealtimeService();
  vi.spyOn(container, 'resolve').mockReturnValue(bus as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('realtimeStream — connect', () => {
  it('rejects the connection when the resolver denies the subscriber', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(null);
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq();
    const { res, raw } = buildRes();

    await expect(handler(req, res, vi.fn())).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(raw.writeHead).not.toHaveBeenCalled();
  });

  it('writes SSE headers and a retry preamble on connect', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(subscriber());
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq();
    const { res, writes, raw } = buildRes();

    await handler(req, res, vi.fn());

    expect(raw.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'text/event-stream' }),
    );
    expect(writes[0]).toBe('retry: 5000\n\n');
  });

  it('does not write past an already-ended response', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(subscriber());
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq();
    const { res, writes, raw } = buildRes();
    raw.writableEnded = true;

    await handler(req, res, vi.fn());

    expect(writes).toHaveLength(0);
  });

  it('swallows write errors from a peer gone between close detection and write', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(subscriber());
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq();
    const { res, raw } = buildRes();
    raw.write.mockImplementation(() => {
      throw new Error('EPIPE');
    });

    await expect(handler(req, res, vi.fn())).resolves.toBeUndefined();
  });
});

describe('realtimeStream — delivery', () => {
  it('delivers events the subscriber holds the required permission for', async () => {
    const resolveSubscriber = vi
      .fn()
      .mockResolvedValue(
        subscriber({ permissions: new Set(['camp.tasks.view']) }),
      );
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, writes } = buildRes();
    await handler(req, res, vi.fn());

    const e = event({ requiredPermission: 'camp.tasks.view' });
    bus.publish('camp-1', e);

    expect(writes).toContain(`data: ${JSON.stringify(e)}\n\n`);
  });

  it('does not deliver events the subscriber lacks the required permission for', async () => {
    const resolveSubscriber = vi
      .fn()
      .mockResolvedValue(subscriber({ permissions: new Set(['camp.view']) }));
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, writes } = buildRes();
    await handler(req, res, vi.fn());

    bus.publish(
      'camp-1',
      event({ resource: 'message', requiredPermission: 'camp.messages.view' }),
    );

    // Only the initial retry preamble — the event itself was withheld.
    expect(writes).toHaveLength(1);
  });

  it('ignores events published for a different camp', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(subscriber());
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, writes } = buildRes();
    await handler(req, res, vi.fn());

    bus.publish('camp-2', event({}));

    // Only the initial retry preamble — nothing for the other camp.
    expect(writes).toHaveLength(1);
  });

  it('closes the stream reactively when an event arrives after the manager expired', async () => {
    vi.useFakeTimers();
    try {
      const expiresAt = new Date(Date.now() + 1_000);
      const resolveSubscriber = vi
        .fn()
        .mockResolvedValue(subscriber({ expiresAt }));
      const handler = realtimeStream(resolveSubscriber);
      const { req } = buildReq('camp-1');
      const { res, raw, writes } = buildRes();
      await handler(req, res, vi.fn());

      vi.advanceTimersByTime(2_000);

      bus.publish('camp-1', event({}));

      expect(raw.end).toHaveBeenCalledTimes(1);
      // The expired-check short-circuits before the event is serialized.
      expect(writes).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('realtimeStream — permission refresh', () => {
  it('refreshes and applies the updated permission set on the subscriber’s own manager event', async () => {
    const resolveSubscriber = vi
      .fn()
      .mockResolvedValueOnce(
        subscriber({ managerId: 'manager-1', permissions: new Set([]) }),
      )
      .mockResolvedValueOnce(
        subscriber({
          managerId: 'manager-1',
          permissions: new Set(['camp.tasks.view']),
        }),
      );
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, writes } = buildRes();
    await handler(req, res, vi.fn());

    bus.publish(
      'camp-1',
      event({
        resource: 'manager',
        id: 'manager-1',
        requiredPermission: 'camp.managers.view',
      }),
    );
    await flushPromises();
    expect(resolveSubscriber).toHaveBeenCalledTimes(2);

    const e = event({ requiredPermission: 'camp.tasks.view' });
    bus.publish('camp-1', e);

    expect(writes).toContain(`data: ${JSON.stringify(e)}\n\n`);
  });

  it('does not refresh for a manager event about a different manager', async () => {
    const resolveSubscriber = vi
      .fn()
      .mockResolvedValue(subscriber({ managerId: 'manager-1' }));
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res } = buildRes();
    await handler(req, res, vi.fn());

    bus.publish(
      'camp-1',
      event({ resource: 'manager', id: 'manager-someone-else' }),
    );
    await flushPromises();

    expect(resolveSubscriber).toHaveBeenCalledTimes(1);
  });

  it('coalesces a manager event that arrives while a refresh is already in flight', async () => {
    let resolveFirstRefresh!: (value: RealtimeSubscriber) => void;
    const firstRefresh = new Promise<RealtimeSubscriber>((res) => {
      resolveFirstRefresh = res;
    });

    const resolveSubscriber = vi
      .fn()
      .mockResolvedValueOnce(subscriber({ managerId: 'manager-1' })) // connect
      .mockReturnValueOnce(firstRefresh) // first refresh: held open
      .mockResolvedValueOnce(subscriber({ managerId: 'manager-1' })); // rerun refresh
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res } = buildRes();
    await handler(req, res, vi.fn());

    const managerEvent = () => event({ resource: 'manager', id: 'manager-1' });

    bus.publish('camp-1', managerEvent());
    // A second manager event while the first refresh is still pending must
    // queue exactly one rerun, not call the resolver again immediately.
    bus.publish('camp-1', managerEvent());
    await flushPromises();
    expect(resolveSubscriber).toHaveBeenCalledTimes(2);

    resolveFirstRefresh(subscriber({ managerId: 'manager-1' }));
    await flushPromises();
    await flushPromises();

    expect(resolveSubscriber).toHaveBeenCalledTimes(3);
  });

  it('closes the stream when a refresh finds the manager no longer authorized', async () => {
    const resolveSubscriber = vi
      .fn()
      .mockResolvedValueOnce(subscriber({ managerId: 'manager-1' }))
      .mockResolvedValueOnce(null);
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, raw } = buildRes();
    await handler(req, res, vi.fn());

    bus.publish('camp-1', event({ resource: 'manager', id: 'manager-1' }));
    await flushPromises();

    expect(raw.end).toHaveBeenCalledTimes(1);
  });

  it('fails closed and logs a warning when the refresh resolver throws', async () => {
    const failure = new Error('db down');
    const resolveSubscriber = vi
      .fn()
      .mockResolvedValueOnce(subscriber({ managerId: 'manager-1' }))
      .mockRejectedValueOnce(failure);
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, raw } = buildRes();
    await handler(req, res, vi.fn());

    bus.publish('camp-1', event({ resource: 'manager', id: 'manager-1' }));
    await flushPromises();

    expect(raw.end).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to refresh realtime subscriber permissions — ending stream',
      failure,
    );
  });

  it('drops a queued rerun refresh once the stream has already closed', async () => {
    let resolveFirstRefresh!: (value: RealtimeSubscriber | null) => void;
    const firstRefresh = new Promise<RealtimeSubscriber | null>((res) => {
      resolveFirstRefresh = res;
    });

    const resolveSubscriber = vi
      .fn()
      .mockResolvedValueOnce(subscriber({ managerId: 'manager-1' })) // connect
      .mockReturnValueOnce(firstRefresh); // first refresh: held open
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, raw } = buildRes();
    await handler(req, res, vi.fn());

    const managerEvent = () => event({ resource: 'manager', id: 'manager-1' });
    bus.publish('camp-1', managerEvent());
    // Queue a rerun while the first refresh is still in flight.
    bus.publish('camp-1', managerEvent());
    await flushPromises();

    // The manager is removed mid-refresh — the stream closes...
    resolveFirstRefresh(null);
    await flushPromises();
    expect(raw.end).toHaveBeenCalledTimes(1);

    // ...and the queued rerun must be a no-op against the closed stream,
    // not call the resolver a third time.
    await flushPromises();
    expect(resolveSubscriber).toHaveBeenCalledTimes(2);
  });
});

describe('realtimeStream — connection lifecycle', () => {
  it('closes the stream when the underlying request closes', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(subscriber());
    const handler = realtimeStream(resolveSubscriber);
    const { req, trigger } = buildReq('camp-1');
    const { res, raw, writes } = buildRes();
    await handler(req, res, vi.fn());

    expect(bus.listenerCount('camp-1')).toBe(1);

    trigger('close');

    expect(raw.end).toHaveBeenCalledTimes(1);
    expect(bus.listenerCount('camp-1')).toBe(0);

    // A closed connection must not receive (or write) further events.
    bus.publish('camp-1', event({}));
    expect(writes).toHaveLength(1); // only the initial retry preamble
  });

  it('is idempotent when closed more than once', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(subscriber());
    const handler = realtimeStream(resolveSubscriber);
    const { req, trigger } = buildReq('camp-1');
    const { res, raw } = buildRes();
    await handler(req, res, vi.fn());

    trigger('close');
    trigger('close');

    expect(raw.end).toHaveBeenCalledTimes(1);
  });
});

describe('realtimeStream — heartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends a periodic heartbeat comment', async () => {
    const resolveSubscriber = vi.fn().mockResolvedValue(subscriber());
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, writes } = buildRes();
    await handler(req, res, vi.fn());

    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);

    expect(writes).toContain(': heartbeat\n\n');
  });

  it('closes an idle connection once its manager expires', async () => {
    const expiresAt = new Date(Date.now() + 10_000);
    const resolveSubscriber = vi
      .fn()
      .mockResolvedValue(subscriber({ expiresAt }));
    const handler = realtimeStream(resolveSubscriber);
    const { req } = buildReq('camp-1');
    const { res, raw, writes } = buildRes();
    await handler(req, res, vi.fn());

    // The heartbeat tick after expiry closes the connection instead of
    // sending another heartbeat comment.
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);

    expect(raw.end).toHaveBeenCalledTimes(1);
    expect(writes).not.toContain(': heartbeat\n\n');
  });
});
