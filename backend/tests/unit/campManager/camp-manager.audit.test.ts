import { describe, expect, it } from 'vitest';
import { campManagerAuditPolicy } from '#app/campManager/camp-manager.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = campManagerAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
};

describe('campManagerAuditPolicy.changeSet', () => {
  it('reports changes only for allow-listed keys', () => {
    const before = {
      userId: 'u1',
      role: 'COUNSELOR',
      expiresAt: null,
      campId: 'c1',
    };
    const after = {
      userId: 'u1',
      role: 'COORDINATOR',
      expiresAt: null,
      campId: 'c1',
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
      campId: 'c1',
    };
    const after = {
      userId: 'u1',
      role: 'COUNSELOR',
      expiresAt: null,
      campId: 'c2',
    };

    // userId/role are still attached — they identify the manager even when
    // nothing else changed.
    expect(policy.changeSet(before, after)).toEqual({
      changedValues: { userId: 'u1', role: 'COUNSELOR' },
    });
  });
});
