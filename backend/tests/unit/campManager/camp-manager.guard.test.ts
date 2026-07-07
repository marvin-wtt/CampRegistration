import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { mock } from 'vitest-mock-extended';
import type { Camp } from '#generated/prisma/client.js';
import * as container from '#core/ioc/container';
import { CampManagerService } from '#app/campManager/camp-manager.service';
import {
  campManager,
  campManagerSubscriber,
  registrationOpen,
} from '#app/campManager/camp-manager.guard';

const managerService = mock<CampManagerService>();

vi.spyOn(container, 'resolve').mockReturnValue(managerService);

const fakeReq = (camp: Partial<Camp>, userId = 'user-1'): Request =>
  ({
    authUserId: () => userId,
    modelOrFail: () => camp,
  }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('campManager', () => {
  it('delegates to CampManagerService.campManagerHasPermission', async () => {
    managerService.campManagerHasPermission.mockResolvedValue(true);
    const guard = campManager('camp.tasks.view');

    const result = await guard(fakeReq({ id: 'camp-1' }, 'user-1'));

    expect(result).toBe(true);
    expect(managerService.campManagerHasPermission).toHaveBeenCalledWith(
      'camp-1',
      'user-1',
      'camp.tasks.view',
    );
  });

  it('returns false when the service reports no permission', async () => {
    managerService.campManagerHasPermission.mockResolvedValue(false);
    const guard = campManager('camp.tasks.view');

    const result = await guard(fakeReq({ id: 'camp-1' }));

    expect(result).toBe(false);
  });
});

describe('campManagerSubscriber', () => {
  it('returns null when the user is not (or no longer) a manager', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(null);

    const result = await campManagerSubscriber(fakeReq({ id: 'camp-1' }));

    expect(result).toBeNull();
  });

  it('maps the authorization to a subscriber snapshot', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00Z');
    managerService.getManagerAuthorization.mockResolvedValue({
      managerId: 'manager-1',
      permissions: ['camp.view', 'camp.tasks.view'],
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

describe('registrationOpen', () => {
  const at = (iso: string) => new Date(iso);

  it('returns false when neither an opens nor a closes date is set', () => {
    const camp = { registrationOpensAt: null, registrationClosesAt: null };

    expect(registrationOpen(fakeReq(camp))).toBe(false);
  });

  it('returns false before the opening date', () => {
    const camp = {
      registrationOpensAt: at('2999-01-01'),
      registrationClosesAt: null,
    };

    expect(registrationOpen(fakeReq(camp))).toBe(false);
  });

  it('returns false after the closing date', () => {
    const camp = {
      registrationOpensAt: null,
      registrationClosesAt: at('2000-01-01'),
    };

    expect(registrationOpen(fakeReq(camp))).toBe(false);
  });

  it('returns true within the registration window', () => {
    const camp = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: at('2999-01-01'),
    };

    expect(registrationOpen(fakeReq(camp))).toBe(true);
  });

  it('returns true when only a past opens date is set', () => {
    const camp = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: null,
    };

    expect(registrationOpen(fakeReq(camp))).toBe(true);
  });

  it('returns true when only a future closes date is set', () => {
    const camp = {
      registrationOpensAt: null,
      registrationClosesAt: at('2999-01-01'),
    };

    expect(registrationOpen(fakeReq(camp))).toBe(true);
  });
});
