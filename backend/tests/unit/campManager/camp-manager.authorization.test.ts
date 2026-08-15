import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CampManagerService } from '#app/campManager/camp-manager.service';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';
import { campPermissionRegistry } from '#core/permission-registry';
import {
  ORGANIZATION_CAMP_PERMISSIONS,
  type Permission,
} from '@camp-registration/common/permissions';
import type { CampManager } from '#generated/prisma/client.js';

const CAMP_ID = 'camp-1';
const USER_ID = 'user-1';

const organizationMembers = mock<OrganizationMemberService>();

const buildService = () => {
  const service = new CampManagerService(organizationMembers);
  // `getManagerByUserId` reaches for Prisma; the merge logic under test only
  // cares about the record it returns.
  return service;
};

const withManagerRecord = (manager: CampManager | null) => {
  const service = buildService();
  vi.spyOn(service, 'getManagerByUserId').mockResolvedValue(manager);
  return service;
};

const managerRecord = (
  role: string,
  expiresAt: Date | null = null,
): CampManager =>
  ({
    id: 'manager-1',
    campId: CAMP_ID,
    userId: USER_ID,
    role,
    invitationId: null,
    expiresAt,
  }) as CampManager;

beforeEach(() => {
  vi.clearAllMocks();
  organizationMembers.getOrganizationCampPermissions.mockResolvedValue([]);

  // The registry is populated at boot by the feature modules; register the
  // slice these tests rely on.
  campPermissionRegistry.registerAll({
    DIRECTOR: [
      'camp.view',
      'camp.edit',
      'camp.delete',
      'camp.managers.view',
      'camp.registrations.view',
    ],
    VIEWER: ['camp.view', 'camp.registrations.view'],
  });
});

describe('CampManagerService.getManagerAuthorization', () => {
  it('returns null for a user with neither a record nor organization access', async () => {
    const service = withManagerRecord(null);

    await expect(
      service.getManagerAuthorization(CAMP_ID, USER_ID),
    ).resolves.toBeNull();
  });

  it('returns the role permissions for a plain camp manager', async () => {
    const service = withManagerRecord(managerRecord('VIEWER'));

    const auth = await service.getManagerAuthorization(CAMP_ID, USER_ID);

    expect(auth?.managerId).toBe('manager-1');
    expect(auth?.permissions).toEqual(
      new Set(['camp.view', 'camp.registrations.view']),
    );
    expect(auth?.expiresAt).toBeNull();
    expect(auth?.revalidate).toBe(false);
  });

  it('returns exactly the organization set for an org admin with no record', async () => {
    organizationMembers.getOrganizationCampPermissions.mockResolvedValue(
      ORGANIZATION_CAMP_PERMISSIONS,
    );
    const service = withManagerRecord(null);

    const auth = await service.getManagerAuthorization(CAMP_ID, USER_ID);

    expect(auth?.permissions).toEqual(new Set(ORGANIZATION_CAMP_PERMISSIONS));
    // No manager record means no realtime event can target them.
    expect(auth?.managerId).toBe('');
    expect(auth?.expiresAt).toBeNull();
    expect(auth?.revalidate).toBe(true);
  });

  it('never grants registration access through organization membership alone', async () => {
    organizationMembers.getOrganizationCampPermissions.mockResolvedValue(
      ORGANIZATION_CAMP_PERMISSIONS,
    );
    const service = withManagerRecord(null);

    const auth = await service.getManagerAuthorization(CAMP_ID, USER_ID);

    expect(auth?.permissions.has('camp.registrations.view')).toBe(false);
    expect(auth?.permissions.has('camp.delete')).toBe(false);
    expect(auth?.permissions.has('camp.managers.create')).toBe(false);
  });

  it('unions both sources when the user is a manager and an org admin', async () => {
    organizationMembers.getOrganizationCampPermissions.mockResolvedValue(
      ORGANIZATION_CAMP_PERMISSIONS,
    );
    const service = withManagerRecord(managerRecord('VIEWER'));

    const auth = await service.getManagerAuthorization(CAMP_ID, USER_ID);

    // VIEWER's own grants survive alongside the organization ones.
    expect(auth?.permissions.has('camp.registrations.view')).toBe(true);
    expect(auth?.permissions.has('camp.edit')).toBe(true);
    expect(auth?.managerId).toBe('manager-1');
    expect(auth?.revalidate).toBe(true);
  });

  it('returns null when the record expired and there is no organization access', async () => {
    const service = withManagerRecord(
      managerRecord('DIRECTOR', new Date(Date.now() - 1000)),
    );

    await expect(
      service.getManagerAuthorization(CAMP_ID, USER_ID),
    ).resolves.toBeNull();
  });

  it('falls back to the organization set when the record expired, without leaking the wider role', async () => {
    organizationMembers.getOrganizationCampPermissions.mockResolvedValue(
      ORGANIZATION_CAMP_PERMISSIONS,
    );
    const service = withManagerRecord(
      managerRecord('DIRECTOR', new Date(Date.now() - 1000)),
    );

    const auth = await service.getManagerAuthorization(CAMP_ID, USER_ID);

    expect(auth?.permissions).toEqual(new Set(ORGANIZATION_CAMP_PERMISSIONS));
    expect(auth?.permissions.has('camp.registrations.view')).toBe(false);
    expect(auth?.permissions.has('camp.delete')).toBe(false);
    expect(auth?.managerId).toBe('');
    expect(auth?.expiresAt).toBeNull();
  });

  it('keeps a live records expiry so the wider set cannot outlive it', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    organizationMembers.getOrganizationCampPermissions.mockResolvedValue(
      ORGANIZATION_CAMP_PERMISSIONS,
    );
    const service = withManagerRecord(managerRecord('DIRECTOR', expiresAt));

    const auth = await service.getManagerAuthorization(CAMP_ID, USER_ID);

    // Clearing this would let DIRECTOR permissions keep serving an open stream
    // past expiry instead of closing it and re-resolving on reconnect.
    expect(auth?.expiresAt).toEqual(expiresAt);
    expect(auth?.permissions.has('camp.delete')).toBe(true);
  });
});

describe('ORGANIZATION_CAMP_PERMISSIONS', () => {
  it('grants only viewing the camp, editing it, and seeing its managers', () => {
    // A guard against widening this set without a deliberate privacy review:
    // organization roles are an ownership relationship, not a data-access one.
    expect([...ORGANIZATION_CAMP_PERMISSIONS]).toEqual<Permission[]>([
      'camp.view',
      'camp.edit',
      'camp.managers.view',
    ]);
  });
});
