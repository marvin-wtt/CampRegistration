import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { mock } from 'vitest-mock-extended';
import type { Event } from '#generated/prisma/client.js';
import * as container from '#core/ioc/container';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import {
  eventManagerSelf,
  eventManagerSubscriber,
} from '#app/eventManager/event-manager.guard';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';

const managerService = mock<EventManagerService>();

vi.spyOn(container, 'resolve').mockReturnValue(managerService);

const fakeReq = (event: Partial<Event>, userId = 'user-1'): Request =>
  ({
    authUserId: () => userId,
    modelOrFail: () => event,
  }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('eventManagerSelf', () => {
  const fakeManagerReq = (userId: string | null, authUserId = 'user-1') =>
    ({
      authUserId: () => authUserId,
      modelOrFail: () => ({ userId }),
    }) as unknown as Request;

  it('returns true when the manager record belongs to the requesting user', () => {
    const result = eventManagerSelf(fakeManagerReq('user-1', 'user-1'));

    expect(result).toBe(true);
  });

  it('returns false when the manager record belongs to someone else', () => {
    const result = eventManagerSelf(fakeManagerReq('user-2', 'user-1'));

    expect(result).toBe(false);
  });

  it('returns false for pending invitations with no associated user', () => {
    const result = eventManagerSelf(fakeManagerReq(null, 'user-1'));

    expect(result).toBe(false);
  });
});

describe('eventManagerSubscriber', () => {
  const fakeAdminReq = (event: Partial<Event>): Request =>
    ({
      authUserId: () => 'admin-1',
      modelOrFail: () => event,
      user: { id: 'admin-1', role: 'ADMIN' },
    }) as unknown as Request;

  it('resolves an admin via getAdminAuthorization without a manager lookup', async () => {
    const adminAuthorization = {
      managerId: '',
      permissions: new Set(Object.values(RESOURCE_VIEW_PERMISSION)),
      expiresAt: null,
    };
    managerService.getAdminAuthorization.mockReturnValue(adminAuthorization);

    const result = await eventManagerSubscriber(
      fakeAdminReq({ id: 'event-1' }),
    );

    expect(result).toBe(adminAuthorization);
    expect(managerService.getAdminAuthorization).toHaveBeenCalledOnce();
    expect(managerService.getManagerAuthorization).not.toHaveBeenCalled();
  });

  it('returns null when the user is not (or no longer) a manager', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(null);

    const result = await eventManagerSubscriber(fakeReq({ id: 'event-1' }));

    expect(result).toBeNull();
  });

  it('maps the authorization to a subscriber snapshot', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00Z');
    managerService.getManagerAuthorization.mockResolvedValue({
      managerId: 'manager-1',
      permissions: new Set(['event.view', 'event.tasks.view']),
      expiresAt,
    });

    const result = await eventManagerSubscriber(
      fakeReq({ id: 'event-1' }, 'user-1'),
    );

    expect(managerService.getManagerAuthorization).toHaveBeenCalledWith(
      'event-1',
      'user-1',
    );
    expect(result).toEqual({
      managerId: 'manager-1',
      permissions: new Set(['event.view', 'event.tasks.view']),
      expiresAt,
    });
  });
});
