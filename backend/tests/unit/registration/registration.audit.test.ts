import { describe, expect, it } from 'vitest';
import {
  registrationAuditPolicy,
  registrationInitialChange,
} from '#app/registration/registration.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

// The policy is typed against the Prisma `Registration`; tests exercise behaviour
// with plain fixtures, so view it through a loose structural type.
const policy = registrationAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
  snapshot(entity: unknown): Record<string, unknown>;
};

describe('registrationAuditPolicy.changeSet', () => {
  it('excludes computed columns and includes status + data leaves', () => {
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

    const changes = policy.changeSet(before, after);

    expect(changes.fields).toEqual({
      status: { from: 'PENDING', to: 'ACCEPTED' },
    });
    expect(changes.data).toEqual({ firstName: { from: 'Ann', to: 'Bob' } });
    expect(changes.fields).not.toHaveProperty('country');
    expect(changes.fields).not.toHaveProperty('firstName');
  });

  it('produces an empty change set when nothing relevant changed', () => {
    const reg = { status: 'PENDING', customData: {}, data: { a: 1 } };
    expect(policy.changeSet(reg, { ...reg })).toEqual({});
  });
});

describe('registrationAuditPolicy.snapshot', () => {
  it('captures source-of-truth fields', () => {
    const snapshot = policy.snapshot({
      firstName: 'Ann',
      status: 'ACCEPTED',
      data: { a: 1 },
    });
    expect(snapshot).toMatchObject({ firstName: 'Ann', status: 'ACCEPTED' });
  });
});

describe('registrationInitialChange', () => {
  it('records the initial status as a from=null transition', () => {
    expect(registrationInitialChange('WAITLISTED')).toEqual({
      fields: { status: { from: null, to: 'WAITLISTED' } },
    });
  });
});
