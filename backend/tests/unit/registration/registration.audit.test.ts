import { describe, expect, it } from 'vitest';
import { registrationAuditPolicy } from '#app/registration/registration.audit';
import type {
  AuditDetails,
  AuditEntityType,
} from '@camp-registration/common/entities';

// The policy is typed against the Prisma `Registration`; tests exercise behaviour
// with plain fixtures, so view it through a loose structural type.
const policy = registrationAuditPolicy as unknown as {
  entityType: AuditEntityType;
  details(before: unknown, after: unknown): AuditDetails;
};

describe('registrationAuditPolicy.details', () => {
  it('records data leaf paths and the new status value', () => {
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

    expect(policy.details(before, after)).toEqual({
      changedFields: ['data.firstName'],
      values: { status: 'ACCEPTED' },
    });
  });

  it('records a status-only change as the new value, no field names', () => {
    const before = { status: 'PENDING', customData: {}, data: {} };
    const after = { status: 'WAITLISTED', customData: {}, data: {} };

    expect(policy.details(before, after)).toEqual({
      values: { status: 'WAITLISTED' },
    });
  });

  it('reports customData changes by full leaf path', () => {
    const before = { status: 'PENDING', customData: { flag: false }, data: {} };
    const after = { status: 'PENDING', customData: { flag: true }, data: {} };

    expect(policy.details(before, after)).toEqual({
      changedFields: ['customData.flag'],
    });
  });

  it('reports nothing when nothing relevant changed', () => {
    const reg = { status: 'PENDING', customData: {}, data: { a: 1 } };
    expect(policy.details(reg, { ...reg })).toEqual({});
  });
});
