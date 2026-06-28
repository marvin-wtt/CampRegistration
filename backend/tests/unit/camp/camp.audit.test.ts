import { describe, expect, it } from 'vitest';
import { campAuditPolicy } from '#app/camp/camp.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = campAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
};

describe('campAuditPolicy.changeSet', () => {
  it('records changes to any config column by default (deny-list)', () => {
    const before = {
      price: 100,
      minAge: 8,
      confirmationMode: 'AUTOMATIC',
    };
    const after = {
      price: 120,
      minAge: 10,
      confirmationMode: 'MANUAL',
    };

    expect(policy.changeSet(before, after).fields).toEqual({
      price: { from: 100, to: 120 },
      minAge: { from: 8, to: 10 },
      confirmationMode: { from: 'AUTOMATIC', to: 'MANUAL' },
    });
  });

  it('records the form field inventory (not the full structure) when it changed', () => {
    const before = {
      form: { pages: [{ elements: [{ type: 'text', name: 'first_name' }] }] },
    };
    const after = {
      form: {
        pages: [
          {
            elements: [
              { type: 'text', name: 'first_name' },
              { type: 'text', name: 'allergies' },
            ],
          },
        ],
      },
    };

    const form = policy.changeSet(before, after).fields?.form;
    expect(form?.from).toEqual(['first_name']);
    expect(form?.to).toEqual(['allergies', 'first_name']);
  });

  it('denies cosmetic (themes) and metadata (updatedAt) columns', () => {
    const before = {
      public: true,
      themes: { color: 'red' },
      updatedAt: '2026-06-01',
    };
    const after = {
      public: true,
      themes: { color: 'blue' },
      updatedAt: '2026-06-28',
    };

    expect(policy.changeSet(before, after)).toEqual({});
  });
});
