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
    const before = { subject: 'Hi', body: '<p>a</p>', priority: 'normal' };
    const after = { subject: 'Hello', body: '<p>b</p>', priority: 'high' };

    // Fields are reported in allow-list order, not sorted.
    expect(policy.changeSet(before, after)).toEqual({
      changedFields: ['subject', 'body', 'priority'],
    });
  });

  it('ignores fields outside the allow-list (id, campId, updatedAt)', () => {
    const before = { subject: 'Hi', campId: 'c1', updatedAt: '2026-06-01' };
    const after = { subject: 'Hi', campId: 'c1', updatedAt: '2026-06-28' };

    expect(policy.changeSet(before, after)).toEqual({});
  });
});
