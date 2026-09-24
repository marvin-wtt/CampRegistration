import { describe, expect, it } from 'vitest';
import {
  eventManagerAuditPolicy,
  managerGrant,
} from '#app/eventManager/event-manager.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = eventManagerAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
};

describe('eventManagerAuditPolicy.changeSet', () => {
  it('records changed allow-listed values plus the identity', () => {
    const before = { userId: 'u1', role: 'COUNSELOR', expiresAt: null };
    const after = { userId: 'u1', role: 'COORDINATOR', expiresAt: null };

    expect(policy.changeSet(before, after)).toEqual({
      changedFields: ['role'],
      changedValues: { role: 'COORDINATOR' },
      context: { role: 'COORDINATOR' },
      subjectId: 'u1',
    });
  });

  it('records nothing when no allow-listed key changed', () => {
    const before = { userId: 'u1', role: 'COUNSELOR', eventId: 'e1' };
    const after = { userId: 'u1', role: 'COUNSELOR', eventId: 'e2' };

    expect(policy.changeSet(before, after)).toEqual({});
  });

  it('records the new expiry as an ISO string', () => {
    const before = { userId: 'u1', role: 'COUNSELOR', expiresAt: null };
    const after = {
      userId: 'u1',
      role: 'COUNSELOR',
      expiresAt: new Date('2026-10-01T00:00:00.000Z'),
    };

    expect(policy.changeSet(before, after)).toEqual({
      changedFields: ['expiresAt'],
      changedValues: { expiresAt: '2026-10-01T00:00:00.000Z' },
      context: { role: 'COUNSELOR' },
      subjectId: 'u1',
    });
    expect(policy.changeSet(after, before)).toMatchObject({
      changedValues: { expiresAt: null },
    });
  });

  it('uses a masked email for a pending invitation (no linked user yet)', () => {
    const invitation = { email: 'jane.doe@example.com' };
    const before = { userId: null, role: 'COUNSELOR', invitation };
    const after = { userId: null, role: 'COORDINATOR', invitation };

    expect(policy.changeSet(before, after)).toEqual({
      changedFields: ['role'],
      changedValues: { role: 'COORDINATOR' },
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
      changedValues: { role: 'VIEWER' },
      context: { role: 'VIEWER' },
      subjectId: 'u1',
    });
    expect(
      managerGrant({
        userId: 'u1',
        role: 'VIEWER',
        expiresAt: new Date('2026-10-01T00:00:00.000Z'),
      }),
    ).toEqual({
      changedValues: { role: 'VIEWER', expiresAt: '2026-10-01T00:00:00.000Z' },
      context: { role: 'VIEWER' },
      subjectId: 'u1',
    });
  });
});
