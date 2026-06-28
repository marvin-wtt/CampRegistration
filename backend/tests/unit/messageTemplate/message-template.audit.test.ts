import { describe, expect, it } from 'vitest';
import { messageTemplateAuditPolicy } from '#app/messageTemplate/message-template.audit';
import type {
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = messageTemplateAuditPolicy as unknown as {
  entityType: AuditEntityType;
  changeSet(before: unknown, after: unknown): AuditChangeSet;
  snapshot(entity: unknown): Record<string, unknown>;
};

describe('messageTemplateAuditPolicy.changeSet', () => {
  it('diffs editable content fields', () => {
    const before = { subject: 'Hi', body: '<p>a</p>', priority: 'normal' };
    const after = { subject: 'Hello', body: '<p>b</p>', priority: 'high' };

    expect(policy.changeSet(before, after).fields).toEqual({
      subject: { from: 'Hi', to: 'Hello' },
      body: { from: '<p>a</p>', to: '<p>b</p>' },
      priority: { from: 'normal', to: 'high' },
    });
  });

  it('ignores fields outside the allow-list (id, campId, updatedAt)', () => {
    const before = { subject: 'Hi', campId: 'c1', updatedAt: '2026-06-01' };
    const after = { subject: 'Hi', campId: 'c1', updatedAt: '2026-06-28' };

    expect(policy.changeSet(before, after)).toEqual({});
  });
});

describe('messageTemplateAuditPolicy.snapshot', () => {
  it('identifies the template without storing the body', () => {
    const snapshot = policy.snapshot({
      event: 'registration_confirmed',
      country: 'de',
      subject: 'Welcome',
      priority: 'normal',
      body: '<p>huge html</p>',
    });

    expect(snapshot).toEqual({
      event: 'registration_confirmed',
      country: 'de',
      subject: 'Welcome',
      priority: 'normal',
    });
    expect(snapshot).not.toHaveProperty('body');
  });
});
