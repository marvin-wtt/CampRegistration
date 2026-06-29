import { describe, expect, it } from 'vitest';
import { registrationAuditPolicy } from '#app/registration/registration.audit';
import type { AuditEntityType } from '@camp-registration/common/entities';

// The policy is typed against the Prisma `Registration`; tests exercise behaviour
// with plain fixtures, so view it through a loose structural type.
const policy = registrationAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changedFields(before: unknown, after: unknown): string[];
};

describe('registrationAuditPolicy.changedFields', () => {
  it('excludes computed columns and reports status + data leaf paths', () => {
    const before = {
      status: 'PENDING',
      customData: {},
      // computed projections of `data` — must be ignored
      firstName: 'Ann',
      country: 'de',
      data: { firstName: 'Ann', notes: 'x' },
    };
    const after = {
      status: 'ACCEPTED',
      customData: {},
      firstName: 'Bob',
      country: 'fr',
      data: { firstName: 'Bob', notes: 'x' },
    };

    expect(policy.changedFields(before, after)).toEqual([
      'data.firstName',
      'status',
    ]);
  });

  it('reports customData changes by full leaf path', () => {
    const before = { status: 'PENDING', customData: { flag: false }, data: {} };
    const after = { status: 'PENDING', customData: { flag: true }, data: {} };

    expect(policy.changedFields(before, after)).toEqual(['customData.flag']);
  });

  it('reports nothing when nothing relevant changed', () => {
    const reg = { status: 'PENDING', customData: {}, data: { a: 1 } };
    expect(policy.changedFields(reg, { ...reg })).toEqual([]);
  });
});
