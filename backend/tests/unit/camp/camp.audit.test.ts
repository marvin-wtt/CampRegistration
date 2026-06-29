import { describe, expect, it } from 'vitest';
import { campAuditPolicy } from '#app/camp/camp.audit';
import type { AuditEntityType } from '@camp-registration/common/entities';

const policy = campAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changedFields(before: unknown, after: unknown): string[];
};

describe('campAuditPolicy.changedFields', () => {
  it('records any config column that changed by default (deny-list)', () => {
    const before = { price: 100, minAge: 8, confirmationMode: 'AUTOMATIC' };
    const after = { price: 120, minAge: 10, confirmationMode: 'MANUAL' };

    expect(policy.changedFields(before, after)).toEqual([
      'confirmationMode',
      'minAge',
      'price',
    ]);
  });

  it('reports added/removed form questions as `form.<name>` paths', () => {
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

    expect(policy.changedFields(before, after)).toEqual(['form.allergies']);
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

    expect(policy.changedFields(before, after)).toEqual([]);
  });
});
