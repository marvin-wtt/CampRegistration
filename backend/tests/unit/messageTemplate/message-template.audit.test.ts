import { describe, expect, it } from 'vitest';
import { messageTemplateAuditPolicy } from '#app/messageTemplate/message-template.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = messageTemplateAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
};

describe('messageTemplateAuditPolicy.changeSet', () => {
  it('reports editable content fields that changed', () => {
    const before = {
      event: 'registration_confirmation',
      country: 'de',
      subject: 'Hi',
      body: '<p>a</p>',
      priority: 'normal',
    };
    const after = {
      event: 'registration_confirmation',
      country: 'de',
      subject: 'Hello',
      body: '<p>b</p>',
      priority: 'high',
    };

    // Fields are reported in allow-list order, not sorted.
    expect(policy.changeSet(before, after)).toEqual({
      changedFields: ['subject', 'body', 'priority'],
      changedValues: { event: 'registration_confirmation', country: 'de' },
    });
  });

  it('ignores fields outside the allow-list (id, campId, updatedAt)', () => {
    const before = {
      event: 'registration_confirmation',
      country: 'de',
      subject: 'Hi',
      campId: 'c1',
      updatedAt: '2026-06-01',
    };
    const after = {
      event: 'registration_confirmation',
      country: 'de',
      subject: 'Hi',
      campId: 'c1',
      updatedAt: '2026-06-28',
    };

    // event/country are still attached — they identify the template even
    // when nothing else changed.
    expect(policy.changeSet(before, after)).toEqual({
      changedValues: { event: 'registration_confirmation', country: 'de' },
    });
  });
});
