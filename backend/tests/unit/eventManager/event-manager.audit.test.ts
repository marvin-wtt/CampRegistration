import { describe, expect, it } from 'vitest';
import { eventManagerAuditPolicy } from '#app/eventManager/event-manager.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = eventManagerAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
};

describe('eventManagerAuditPolicy.changeSet', () => {
  it('reports changes only for allow-listed keys', () => {
    const before = {
      userId: 'u1',
      role: 'COUNSELOR',
      expiresAt: null,
      eventId: 'e1',
    };
    const after = {
      userId: 'u1',
      role: 'COORDINATOR',
      expiresAt: null,
      eventId: 'e1',
    };

    expect(policy.changeSet(before, after)).toEqual({
      changedFields: ['role'],
      changedValues: { userId: 'u1', role: 'COORDINATOR' },
    });
  });

  it('ignores keys outside the allow-list', () => {
    const before = {
      userId: 'u1',
      role: 'COUNSELOR',
      expiresAt: null,
      eventId: 'e1',
    };
    const after = {
      userId: 'u1',
      role: 'COUNSELOR',
      expiresAt: null,
      eventId: 'e2',
    };

    // userId/role are still attached — they identify the manager even when
    // nothing else changed.
    expect(policy.changeSet(before, after)).toEqual({
      changedValues: { userId: 'u1', role: 'COUNSELOR' },
    });
  });
});
