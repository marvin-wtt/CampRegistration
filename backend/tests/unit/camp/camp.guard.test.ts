import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { mock } from 'vitest-mock-extended';
import type { Camp } from '#generated/prisma/client';
import type { CampScopedPermission } from '@camp-registration/common/permissions';
import * as container from '#core/ioc/container';
import { CampManagerService } from '#app/campManager/camp-manager.service';
import {
  campManager,
  campOrganizationVerified,
  campScopeResolver,
  registrationOpen,
} from '#app/camp/camp.guard';
import { registerScopeResolver } from '#core/permission.guard';

// `campManager()` is an alias of the generic `scoped('camp', …)` guard, which
// looks the camp resolver up in the boot-time registry. `boot()` does not run
// here, so stand the one scope under test up by hand.
registerScopeResolver('camp', campScopeResolver);

const managerService = mock<CampManagerService>();

vi.spyOn(container, 'resolve').mockReturnValue(managerService);

type CampFixture = Partial<Camp> & {
  organization?: { id: string; verificationStatus: string };
};

const fakeReq = (camp: CampFixture, userId = 'user-1'): Request =>
  ({
    authUserId: () => userId,
    modelOrFail: () => ({
      organization: { id: 'org-1', verificationStatus: 'VERIFIED' },
      ...camp,
    }),
  }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('campManager', () => {
  const authorization = (permissions: CampScopedPermission[]) => ({
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

  it('returns false at the closing date', () => {
    const closesAt = at('2026-01-01T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(closesAt);

    const camp = {
      registrationOpensAt: null,
      registrationClosesAt: closesAt,
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

  it('ignores the organization, which the route checks separately', () => {
    const camp = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: at('2999-01-01'),
      organization: { id: 'org-1', verificationStatus: 'PENDING' },
    };

    expect(registrationOpen(fakeReq(camp))).toBe(true);
  });
});

describe('campOrganizationVerified', () => {
  it('returns true when the organization is VERIFIED', () => {
    const camp = {
      organization: { id: 'org-1', verificationStatus: 'VERIFIED' },
    };

    expect(campOrganizationVerified(fakeReq(camp))).toBe(true);
  });

  it.each(['PENDING', 'REJECTED'] as const)(
    'returns false when the organization is %s',
    (verificationStatus) => {
      // The safety net for a camp published before its organization was
      // rejected: registration stops immediately, without waiting for the
      // unpublish pass.
      const camp = { organization: { id: 'org-1', verificationStatus } };

      expect(campOrganizationVerified(fakeReq(camp))).toBe(false);
    },
  );
});
