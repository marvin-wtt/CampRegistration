import { describe, expect, it } from 'vitest';
import { campManagerAuditPolicy } from '#app/campManager/camp-manager.audit';
import type { AuditEntityType } from '@camp-registration/common/entities';

const policy = campManagerAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changedFields(before: unknown, after: unknown): string[];
};

describe('campManagerAuditPolicy.changedFields', () => {
  it('reports changes only for allow-listed keys', () => {
    const before = { role: 'COUNSELOR', expiresAt: null, campId: 'c1' };
    const after = { role: 'COORDINATOR', expiresAt: null, campId: 'c1' };

    expect(policy.changedFields(before, after)).toEqual(['role']);
  });

  it('ignores keys outside the allow-list', () => {
    const before = { role: 'COUNSELOR', expiresAt: null, campId: 'c1' };
    const after = { role: 'COUNSELOR', expiresAt: null, campId: 'c2' };

    expect(policy.changedFields(before, after)).toEqual([]);
  });
});
