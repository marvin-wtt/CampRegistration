import { describe, expect, it } from 'vitest';
import { messageTemplateAuditPolicy } from '#app/messageTemplate/message-template.audit';
import type { AuditEntityType } from '@camp-registration/common/entities';

const policy = messageTemplateAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changedFields(before: unknown, after: unknown): string[];
};

describe('messageTemplateAuditPolicy.changedFields', () => {
  it('reports editable content fields that changed', () => {
    const before = { subject: 'Hi', body: '<p>a</p>', priority: 'normal' };
    const after = { subject: 'Hello', body: '<p>b</p>', priority: 'high' };

    expect(policy.changedFields(before, after)).toEqual([
      'body',
      'priority',
      'subject',
    ]);
  });

  it('ignores fields outside the allow-list (id, campId, updatedAt)', () => {
    const before = { subject: 'Hi', campId: 'c1', updatedAt: '2026-06-01' };
    const after = { subject: 'Hi', campId: 'c1', updatedAt: '2026-06-28' };

    expect(policy.changedFields(before, after)).toEqual([]);
  });
});
