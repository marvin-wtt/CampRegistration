import { describe, expect, it } from 'vitest';
import { campManagerAuditPolicy } from '#app/campManager/camp-manager.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = campManagerAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
  snapshot(entity: unknown): Record<string, unknown>;
};

describe('campManagerAuditPolicy.changeSet', () => {
  it('reports role changes only for allow-listed keys', () => {
    const before = { role: 'COUNSELOR', expiresAt: null, campId: 'c1' };
    const after = { role: 'COORDINATOR', expiresAt: null, campId: 'c1' };

    const changes = policy.changeSet(before, after);

    expect(changes.fields).toEqual({
      role: { from: 'COUNSELOR', to: 'COORDINATOR' },
    });
    expect(changes.fields).not.toHaveProperty('campId');
  });
});

describe('campManagerAuditPolicy.snapshot', () => {
  it('captures role/userId/expiresAt', () => {
    const snapshot = policy.snapshot({
      role: 'DIRECTOR',
      userId: 'u1',
      expiresAt: null,
    });
    expect(snapshot).toEqual({
      role: 'DIRECTOR',
      userId: 'u1',
      expiresAt: null,
    });
  });

  it('includes the invitation email when present (invite vs add)', () => {
    const snapshot = policy.snapshot({
      role: 'VIEWER',
      userId: null,
      expiresAt: null,
      invitation: { email: 'invitee@example.com' },
    });
    expect(snapshot.email).toBe('invitee@example.com');
  });
});
