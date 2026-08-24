import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { mock } from 'vitest-mock-extended';
import type { Event } from '#generated/prisma/client';
import type { EventScopedPermission } from '@camp-registration/common/permissions';
import * as container from '#core/ioc/container';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import {
  hasEventPermission,
  eventOrganizationVerified,
  eventScopeResolver,
  registrationOpen,
} from '#app/event/event.guard';
import { registerScopeResolver } from '#core/permission.guard';

// `hasEventPermission()` is an alias of the generic `scoped('event', …)` guard, which
// looks the event resolver up in the boot-time registry. `boot()` does not run
// here, so stand the one scope under test up by hand.
registerScopeResolver('event', eventScopeResolver);

const managerService = mock<EventManagerService>();

vi.spyOn(container, 'resolve').mockReturnValue(managerService);

type EventFixture = Partial<Event> & {
  organization?: { id: string; verificationStatus: string };
};

const fakeReq = (event: EventFixture, userId = 'user-1'): Request =>
  ({
    authUserId: () => userId,
    modelOrFail: () => ({
      organization: { id: 'org-1', verificationStatus: 'VERIFIED' },
      ...event,
    }),
  }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('hasEventPermission', () => {
  const authorization = (permissions: EventScopedPermission[]) => ({
    managerId: 'manager-1',
    permissions: new Set(permissions),
    expiresAt: null,
  });

  it('resolves through EventManagerService.getManagerAuthorization', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(
      authorization(['event.tasks.view']),
    );
    const guard = hasEventPermission('event.tasks.view');

    const result = await guard(fakeReq({ id: 'event-1' }, 'user-1'));

    expect(result).toBe(true);
    expect(managerService.getManagerAuthorization).toHaveBeenCalledWith(
      'event-1',
      'user-1',
    );
  });

  it('returns false when the permission is not in the resolved set', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(
      authorization(['event.view']),
    );
    const guard = hasEventPermission('event.tasks.view');

    const result = await guard(fakeReq({ id: 'event-1' }));

    expect(result).toBe(false);
  });

  it('returns false when the user has no authorization at all', async () => {
    managerService.getManagerAuthorization.mockResolvedValue(null);
    const guard = hasEventPermission('event.tasks.view');

    const result = await guard(fakeReq({ id: 'event-1' }));

    expect(result).toBe(false);
  });
});

describe('registrationOpen', () => {
  const at = (iso: string) => new Date(iso);

  it('returns false when neither an opens nor a closes date is set', () => {
    const event = { registrationOpensAt: null, registrationClosesAt: null };

    expect(registrationOpen(fakeReq(event))).toBe(false);
  });

  it('returns false before the opening date', () => {
    const event = {
      registrationOpensAt: at('2999-01-01'),
      registrationClosesAt: null,
    };

    expect(registrationOpen(fakeReq(event))).toBe(false);
  });

  it('returns false after the closing date', () => {
    const event = {
      registrationOpensAt: null,
      registrationClosesAt: at('2000-01-01'),
    };

    expect(registrationOpen(fakeReq(event))).toBe(false);
  });

  it('returns false at the closing date', () => {
    const closesAt = at('2026-01-01T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(closesAt);

    const event = {
      registrationOpensAt: null,
      registrationClosesAt: closesAt,
    };

    expect(registrationOpen(fakeReq(event))).toBe(false);
  });

  it('returns true within the registration window', () => {
    const event = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: at('2999-01-01'),
    };

    expect(registrationOpen(fakeReq(event))).toBe(true);
  });

  it('returns true when only a past opens date is set', () => {
    const event = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: null,
    };

    expect(registrationOpen(fakeReq(event))).toBe(true);
  });

  it('returns true when only a future closes date is set', () => {
    const event = {
      registrationOpensAt: null,
      registrationClosesAt: at('2999-01-01'),
    };

    expect(registrationOpen(fakeReq(event))).toBe(true);
  });

  it('ignores the organization, which the route checks separately', () => {
    const event = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: at('2999-01-01'),
      organization: { id: 'org-1', verificationStatus: 'PENDING' },
    };

    expect(registrationOpen(fakeReq(event))).toBe(true);
  });
});

describe('eventOrganizationVerified', () => {
  it('returns true when the organization is VERIFIED', () => {
    const event = {
      organization: { id: 'org-1', verificationStatus: 'VERIFIED' },
    };

    expect(eventOrganizationVerified(fakeReq(event))).toBe(true);
  });

  it.each(['PENDING', 'REJECTED'] as const)(
    'returns false when the organization is %s',
    (verificationStatus) => {
      // The safety net for a event published before its organization was
      // rejected: registration stops immediately, without waiting for the
      // unpublish pass.
      const event = { organization: { id: 'org-1', verificationStatus } };

      expect(eventOrganizationVerified(fakeReq(event))).toBe(false);
    },
  );
});
