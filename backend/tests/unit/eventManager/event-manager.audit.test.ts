import { describe, expect, it } from 'vitest';
import {
  eventManagerAuditPolicy,
  managerGrant,
} from '#app/eventManager/event-manager.audit';
import type {
  AuditDetails,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = eventManagerAuditPolicy as unknown as {
  entityType: AuditEntityType;
  details(before: unknown, after: unknown): AuditDetails;
};

describe('eventManagerAuditPolicy.details', () => {
  it('records changed allow-listed values plus the identity', () => {
    const before = { userId: 'u1', role: 'COUNSELOR', expiresAt: null };
    const after = { userId: 'u1', role: 'COORDINATOR', expiresAt: null };

    expect(policy.details(before, after)).toEqual({
      changedFields: ['role'],
      values: { role: 'COORDINATOR' },
      context: { role: 'COORDINATOR' },
      subjectId: 'u1',
    });
  });

  it('records nothing when no allow-listed key changed', () => {
    const before = { userId: 'u1', role: 'COUNSELOR', eventId: 'e1' };
    const after = { userId: 'u1', role: 'COUNSELOR', eventId: 'e2' };

    expect(policy.details(before, after)).toEqual({});
  });

  it('records the new expiry as an ISO string', () => {
    const before = { userId: 'u1', role: 'COUNSELOR', expiresAt: null };
    const after = {
      userId: 'u1',
      role: 'COUNSELOR',
      expiresAt: new Date('2026-10-01T00:00:00.000Z'),
    };

    expect(policy.details(before, after)).toEqual({
      changedFields: ['expiresAt'],
      values: { expiresAt: '2026-10-01T00:00:00.000Z' },
      context: { role: 'COUNSELOR' },
      subjectId: 'u1',
    });
    expect(policy.details(after, before)).toMatchObject({
      values: { expiresAt: null },
    });
  });

  it('uses a masked email for a pending invitation (no linked user yet)', () => {
    const invitation = { email: 'jane.doe@example.com' };
    const before = { userId: null, role: 'COUNSELOR', invitation };
    const after = { userId: null, role: 'COORDINATOR', invitation };

    expect(policy.details(before, after)).toEqual({
      changedFields: ['role'],
      values: { role: 'COORDINATOR' },
      context: { role: 'COORDINATOR' },
      subjectHint: 'j***@example.com',
    });
  });
});

describe('managerGrant', () => {
  it('records the initial role, and the expiry only when set', () => {
    expect(
      managerGrant({ userId: 'u1', role: 'VIEWER', expiresAt: null }),
    ).toEqual({
      values: { role: 'VIEWER' },
    });
    expect(
      managerGrant({
        userId: 'u1',
        role: 'VIEWER',
        expiresAt: new Date('2026-10-01T00:00:00.000Z'),
      }),
    ).toEqual({
      values: { role: 'VIEWER', expiresAt: '2026-10-01T00:00:00.000Z' },
    });
  });
});
