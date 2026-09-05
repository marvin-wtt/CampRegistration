import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';
import { AuditService } from '#app/audit/audit.service';
import { permissionRegistry } from '#core/permission-registry';
import {
  ORGANIZATION_EVENT_PERMISSIONS,
  ORGANIZATION_NEWSLETTER_PERMISSIONS,
  type Permission,
} from '@camp-registration/common/permissions';
import type { EventManager } from '#generated/prisma/client.js';

const EVENT_ID = 'event-1';
const USER_ID = 'user-1';

const organizationMembers = mock<OrganizationMemberService>();
const audit = mock<AuditService>();

const buildService = () => {
  const service = new EventManagerService(organizationMembers, audit);
  // `getManagerByUserId` reaches for Prisma; the merge logic under test only
  // cares about the record it returns.
  return service;
};

const withManagerRecord = (manager: EventManager | null) => {
  const service = buildService();
  vi.spyOn(service, 'getManagerByUserId').mockResolvedValue(manager);
  return service;
};

const managerRecord = (
  role: string,
  expiresAt: Date | null = null,
): EventManager =>
  ({
    id: 'manager-1',
    eventId: EVENT_ID,
    userId: USER_ID,
    role,
    invitationId: null,
    expiresAt,
  }) as EventManager;

beforeEach(() => {
  vi.clearAllMocks();
  organizationMembers.getOrganizationEventPermissions.mockResolvedValue([]);

  // The registry is populated at boot by the feature modules; register the
  // slice these tests rely on.
  permissionRegistry.for('event').registerAll({
    DIRECTOR: [
      'event.view',
      'event.edit',
      'event.delete',
      'event.managers.view',
      'event.registrations.view',
    ],
    VIEWER: ['event.view', 'event.registrations.view'],
  });
});

describe('EventManagerService.getManagerAuthorization', () => {
  it('returns null for a user with neither a record nor organization access', async () => {
    const service = withManagerRecord(null);

    await expect(
      service.getManagerAuthorization(EVENT_ID, USER_ID),
    ).resolves.toBeNull();
  });

  it('returns the role permissions for a plain event manager', async () => {
    const service = withManagerRecord(managerRecord('VIEWER'));

    const auth = await service.getManagerAuthorization(EVENT_ID, USER_ID);

    expect(auth?.managerId).toBe('manager-1');
    expect(auth?.permissions).toEqual(
      new Set(['event.view', 'event.registrations.view']),
    );
    expect(auth?.expiresAt).toBeNull();
    expect(auth?.revalidate).toBe(false);
  });

  it('returns exactly the organization set for an org admin with no record', async () => {
    organizationMembers.getOrganizationEventPermissions.mockResolvedValue(
      ORGANIZATION_EVENT_PERMISSIONS,
    );
    const service = withManagerRecord(null);

    const auth = await service.getManagerAuthorization(EVENT_ID, USER_ID);

    expect(auth?.permissions).toEqual(new Set(ORGANIZATION_EVENT_PERMISSIONS));
    // No manager record means no realtime event can target them.
    expect(auth?.managerId).toBe('');
    expect(auth?.expiresAt).toBeNull();
    expect(auth?.revalidate).toBe(true);
  });

  it('never grants registration access through organization membership alone', async () => {
    organizationMembers.getOrganizationEventPermissions.mockResolvedValue(
      ORGANIZATION_EVENT_PERMISSIONS,
    );
    const service = withManagerRecord(null);

    const auth = await service.getManagerAuthorization(EVENT_ID, USER_ID);

    expect(auth?.permissions.has('event.registrations.view')).toBe(false);
    expect(auth?.permissions.has('event.delete')).toBe(false);
    expect(auth?.permissions.has('event.managers.create')).toBe(false);
  });

  it('unions both sources when the user is a manager and an org admin', async () => {
    organizationMembers.getOrganizationEventPermissions.mockResolvedValue(
      ORGANIZATION_EVENT_PERMISSIONS,
    );
    const service = withManagerRecord(managerRecord('VIEWER'));

    const auth = await service.getManagerAuthorization(EVENT_ID, USER_ID);

    // VIEWER's own grants survive alongside the organization ones.
    expect(auth?.permissions.has('event.registrations.view')).toBe(true);
    expect(auth?.permissions.has('event.edit')).toBe(true);
    expect(auth?.managerId).toBe('manager-1');
    expect(auth?.revalidate).toBe(true);
  });

  it('returns null when the record expired and there is no organization access', async () => {
    const service = withManagerRecord(
      managerRecord('DIRECTOR', new Date(Date.now() - 1000)),
    );

    await expect(
      service.getManagerAuthorization(EVENT_ID, USER_ID),
    ).resolves.toBeNull();
  });

  it('falls back to the organization set when the record expired, without leaking the wider role', async () => {
    organizationMembers.getOrganizationEventPermissions.mockResolvedValue(
      ORGANIZATION_EVENT_PERMISSIONS,
    );
    const service = withManagerRecord(
      managerRecord('DIRECTOR', new Date(Date.now() - 1000)),
    );

    const auth = await service.getManagerAuthorization(EVENT_ID, USER_ID);

    expect(auth?.permissions).toEqual(new Set(ORGANIZATION_EVENT_PERMISSIONS));
    expect(auth?.permissions.has('event.registrations.view')).toBe(false);
    expect(auth?.permissions.has('event.delete')).toBe(false);
    expect(auth?.managerId).toBe('');
    expect(auth?.expiresAt).toBeNull();
  });

  it('keeps a live records expiry so the wider set cannot outlive it', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    organizationMembers.getOrganizationEventPermissions.mockResolvedValue(
      ORGANIZATION_EVENT_PERMISSIONS,
    );
    const service = withManagerRecord(managerRecord('DIRECTOR', expiresAt));

    const auth = await service.getManagerAuthorization(EVENT_ID, USER_ID);

    // Clearing this would let DIRECTOR permissions keep serving an open stream
    // past expiry instead of closing it and re-resolving on reconnect.
    expect(auth?.expiresAt).toEqual(expiresAt);
    expect(auth?.permissions.has('event.delete')).toBe(true);
  });
});

describe('ORGANIZATION_EVENT_PERMISSIONS', () => {
  it('grants only viewing the event, editing it, and seeing its managers', () => {
    // A guard against widening this set without a deliberate privacy review:
    // organization roles are an ownership relationship, not a data-access one.
    expect([...ORGANIZATION_EVENT_PERMISSIONS]).toEqual<Permission[]>([
      'event.view',
      'event.edit',
      'event.managers.view',
    ]);
  });
});

describe('ORGANIZATION_NEWSLETTER_PERMISSIONS', () => {
  it('grants only viewing the newsletter and seeing its managers', () => {
    // Same privacy review as the event set. Subscribers are personal data and
    // `newsletter.messages.*` would let an owner read or send the
    // organization's mail without ever being made a manager.
    expect([...ORGANIZATION_NEWSLETTER_PERMISSIONS]).toEqual<Permission[]>([
      'newsletter.view',
      'newsletter.managers.view',
    ]);
  });
});
