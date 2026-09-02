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
      changedValues: { role: 'COORDINATOR' },
      subjectId: 'u1',
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

    // subjectId/role are still attached — they identify the manager even when
    // nothing else changed.
    expect(policy.changeSet(before, after)).toEqual({
      changedValues: { role: 'COUNSELOR' },
      subjectId: 'u1',
    });
  });

  it('omits subjectId for a pending invitation (no linked user yet)', () => {
    const before = {
      userId: null,
      role: 'COUNSELOR',
      expiresAt: null,
      eventId: 'e1',
    };
    const after = {
      userId: null,
      role: 'COORDINATOR',
      expiresAt: null,
      eventId: 'e1',
    };

    expect(policy.changeSet(before, after)).toEqual({
      changedFields: ['role'],
      changedValues: { role: 'COORDINATOR' },
    });
  });
});
