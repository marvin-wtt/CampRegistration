import { describe, expect, it, vi } from 'vitest';
import type {
  RealtimeEvent,
  RealtimeResource,
} from '@camp-registration/common/realtime';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';
import type { Permission } from '@camp-registration/common/permissions';
import { MemoryRealtimeBus } from '#core/realtime/MemoryRealtimeBus';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { runWithRequestContext } from '#core/context/requestContext';
import {
  shouldDeliver,
  shouldRefreshOn,
  type RealtimeSubscriber,
} from '#app/realtime/realtime.stream';
import type { AppConfig } from '#config';

const memoryConfig = {
  realtime: { driver: 'memory' },
} as AppConfig;

const subscriber = (
  ...permissions: Permission[]
): RealtimeSubscriber & { managerId: string } => ({
  managerId: 'manager-self',
  permissions: new Set(permissions),
  expiresAt: null,
});

const event = (partial: Partial<RealtimeEvent>): RealtimeEvent => ({
  resource: 'registration',
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  operation: 'updated',
  at: new Date().toISOString(),
  ...partial,
});

describe('shouldDeliver', () => {
  it('delivers when the subscriber holds the required permission', () => {
    expect(
      shouldDeliver(
        event({ requiredPermission: 'camp.tasks.view' }),
        subscriber('camp.view', 'camp.tasks.view'),
      ),
    ).toBe(true);
  });

  it('blocks manager events for subscribers without managers.view (VIEWER)', () => {
    // VIEWER permission set contains no camp.managers.view.
    expect(
      shouldDeliver(
        event({
          resource: 'manager',
          requiredPermission: 'camp.managers.view',
        }),
        subscriber('camp.view', 'camp.registrations.view', 'camp.tasks.view'),
      ),
    ).toBe(false);
  });

  it('blocks message events for subscribers without messages.view (COUNSELOR)', () => {
    expect(
      shouldDeliver(
        event({
          resource: 'message',
          requiredPermission: 'camp.messages.view',
        }),
        subscriber('camp.view', 'camp.managers.view', 'camp.tasks.view'),
      ),
    ).toBe(false);
  });

  it('delivers events without a required permission', () => {
    expect(shouldDeliver(event({}), subscriber())).toBe(true);
  });
});

describe('shouldRefreshOn', () => {
  it("refreshes when the manager event is about this subscriber's own record", () => {
    expect(
      shouldRefreshOn(
        event({ resource: 'manager', id: 'manager-self' }),
        subscriber(),
      ),
    ).toBe(true);
  });

  it("does not refresh for a different manager's event", () => {
    expect(
      shouldRefreshOn(
        event({ resource: 'manager', id: 'manager-someone-else' }),
        subscriber(),
      ),
    ).toBe(false);
  });

  it('ignores non-manager events even if the id happens to match', () => {
    expect(
      shouldRefreshOn(
        event({ resource: 'task', id: 'manager-self' }),
        subscriber(),
      ),
    ).toBe(false);
  });
});

describe('MemoryRealtimeBus', () => {
  it('delivers published events to subscribers of the same camp only', () => {
    const bus = new MemoryRealtimeBus();
    const received: RealtimeEvent[] = [];
    const other = vi.fn();

    bus.subscribe('camp-a', (e) => received.push(e));
    bus.subscribe('camp-b', other);

    const e = event({});
    bus.publish('camp-a', e);

    expect(received).toEqual([e]);
    expect(other).not.toHaveBeenCalled();
  });

  it('stops delivery after unsubscribe', () => {
    const bus = new MemoryRealtimeBus();
    const listener = vi.fn();

    const unsubscribe = bus.subscribe('camp-a', listener);
    unsubscribe();
    bus.publish('camp-a', event({}));

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('RealtimeService', () => {
  it('uses the memory bus when the realtime driver is memory', () => {
    const service = new RealtimeService(memoryConfig);

    expect(service.busType).toBe('memory');
  });

  it('stamps the required view permission for every resource', async () => {
    const service = new RealtimeService(memoryConfig);
    const received: RealtimeEvent[] = [];
    service.subscribe('camp-a', (e) => received.push(e));

    const resources = Object.keys(
      RESOURCE_VIEW_PERMISSION,
    ) as RealtimeResource[];
    for (const resource of resources) {
      await service.emit('camp-a', resource, 'some-id', 'updated');
    }

    expect(received).toHaveLength(resources.length);
    for (const e of received) {
      expect(e.requiredPermission).toBe(RESOURCE_VIEW_PERMISSION[e.resource]);
      expect(e.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('stamps the origin from the ambient request context', async () => {
    const service = new RealtimeService(memoryConfig);
    const received: RealtimeEvent[] = [];
    service.subscribe('camp-a', (e) => received.push(e));

    await new Promise<void>((resolve, reject) => {
      runWithRequestContext({ clientId: 'client-42' }, () => {
        service
          .emit('camp-a', 'task', 'task-1', 'created')
          .then(resolve, reject);
      });
    });

    expect(received[0]?.origin).toBe('client-42');
  });

  it('emits without an origin outside a request context', async () => {
    const service = new RealtimeService(memoryConfig);
    const received: RealtimeEvent[] = [];
    service.subscribe('camp-a', (e) => received.push(e));

    // e.g. queue jobs / scheduler — everyone must react, incl. the originator.
    await service.emit('camp-a', 'task', 'task-1', 'created');

    expect(received[0]?.origin).toBeUndefined();
  });

  it('emitInvalidation publishes a collection-level event with a null id', async () => {
    const service = new RealtimeService(memoryConfig);
    const received: RealtimeEvent[] = [];
    service.subscribe('camp-a', (e) => received.push(e));

    await new Promise<void>((resolve, reject) => {
      runWithRequestContext({ clientId: 'client-42' }, () => {
        service.emitInvalidation('camp-a', 'room').then(resolve, reject);
      });
    });

    expect(received).toEqual([
      expect.objectContaining({
        resource: 'room',
        id: null,
        operation: 'invalidated',
        requiredPermission: 'camp.rooms.view',
        origin: 'client-42',
      }),
    ]);
  });

  it('swallows bus failures instead of failing the emitting action', async () => {
    const service = new RealtimeService(memoryConfig);
    service.subscribe('camp-a', () => {
      throw new Error('listener exploded');
    });

    await expect(
      service.emit('camp-a', 'task', 'task-1', 'created'),
    ).resolves.toBeUndefined();
  });
});
