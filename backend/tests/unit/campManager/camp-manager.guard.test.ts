import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { mock } from 'vitest-mock-extended';
import type { Camp } from '#generated/prisma/client.js';
import * as container from '#core/ioc/container';
import { CampManagerService } from '#app/campManager/camp-manager.service';
import {
  campManager,
  campManagerSelf,
  campManagerSubscriber,
  campScopeResolver,
} from '#app/campManager/camp-manager.guard';
import { registerScopeResolver } from '#core/permission.guard';
import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';

// `campManager()` is an alias of the generic `scoped('camp', …)` guard, which
// looks the camp resolver up in the boot-time registry. `boot()` does not run
// here, so stand the one scope under test up by hand.
registerScopeResolver('camp', campScopeResolver);

const managerService = mock<CampManagerService>();

vi.spyOn(container, 'resolve').mockReturnValue(managerService);

const fakeReq = (camp: Partial<Camp>, userId = 'user-1'): Request =>
  ({
    authUserId: () => userId,
    modelOrFail: () => camp,
  }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('campManager', () => {
  const authorization = (permissions: string[]) => ({
    managerId: 'manager-1',
    permissions: new Set(permissions),
    expiresAt: null,
  });

  it('resolves through CampManagerService.getManagerAuthorization', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(
      authorization(['camp.tasks.view']),
    );
    const guard = campManager('camp.tasks.view');

    const result = await guard(fakeReq({ id: 'camp-1' }, 'user-1'));

    expect(result).toBe(true);
    expect(managerService.getManagerAuthorization).toHaveBeenCalledWith(
      'camp-1',
      'user-1',
    );
  });

  it('returns false when the permission is not in the resolved set', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(
      authorization(['camp.view']),
    );
    const guard = campManager('camp.tasks.view');

    const result = await guard(fakeReq({ id: 'camp-1' }));

    expect(result).toBe(false);
  });

  it('returns false when the user has no authorization at all', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(null);
    const guard = campManager('camp.tasks.view');

    const result = await guard(fakeReq({ id: 'camp-1' }));

    expect(result).toBe(false);
  });
});

describe('campManagerSelf', () => {
  const fakeManagerReq = (userId: string | null, authUserId = 'user-1') =>
    ({
      authUserId: () => authUserId,
      modelOrFail: () => ({ userId }),
    }) as unknown as Request;

  it('returns true when the manager record belongs to the requesting user', () => {
    const result = campManagerSelf(fakeManagerReq('user-1', 'user-1'));

    expect(result).toBe(true);
  });

  it('returns false when the manager record belongs to someone else', () => {
    const result = campManagerSelf(fakeManagerReq('user-2', 'user-1'));

    expect(result).toBe(false);
  });

  it('returns false for pending invitations with no associated user', () => {
    const result = campManagerSelf(fakeManagerReq(null, 'user-1'));

    expect(result).toBe(false);
  });
});

describe('campManagerSubscriber', () => {
  const fakeAdminReq = (camp: Partial<Camp>): Request =>
    ({
      authUserId: () => 'admin-1',
      modelOrFail: () => camp,
      user: { id: 'admin-1', role: 'ADMIN' },
    }) as unknown as Request;

  it('resolves an admin via getAdminAuthorization without a manager lookup', async () => {
    const adminAuthorization = {
      managerId: '',
      permissions: new Set(Object.values(RESOURCE_VIEW_PERMISSION)),
      expiresAt: null,
    };
    managerService.getAdminAuthorization.mockReturnValue(adminAuthorization);

    const result = await campManagerSubscriber(fakeAdminReq({ id: 'camp-1' }));

    expect(result).toBe(adminAuthorization);
    expect(managerService.getAdminAuthorization).toHaveBeenCalledOnce();
    expect(managerService.getManagerAuthorization).not.toHaveBeenCalled();
  });

  it('returns null when the user is not (or no longer) a manager', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(null);

    const result = await campManagerSubscriber(fakeReq({ id: 'camp-1' }));

    expect(result).toBeNull();
  });

  it('maps the authorization to a subscriber snapshot', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00Z');
    managerService.getManagerAuthorization.mockResolvedValue({
      managerId: 'manager-1',
      permissions: new Set(['camp.view', 'camp.tasks.view']),
      expiresAt,
    });

    const result = await campManagerSubscriber(
      fakeReq({ id: 'camp-1' }, 'user-1'),
    );

    expect(managerService.getManagerAuthorization).toHaveBeenCalledWith(
      'camp-1',
      'user-1',
    );
    expect(result).toEqual({
      managerId: 'manager-1',
      permissions: new Set(['camp.view', 'camp.tasks.view']),
      expiresAt,
    });
  });
});
