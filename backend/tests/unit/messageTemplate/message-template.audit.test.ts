import { describe, expect, it } from 'vitest';
import { messageTemplateAuditPolicy } from '#app/messageTemplate/message-template.audit';
import type {
  AuditDetails,
  AuditEntityType,
} from '@camp-registration/common/entities';

const policy = messageTemplateAuditPolicy as unknown as {
  entityType: AuditEntityType;
  details(before: unknown, after: unknown): AuditDetails;
};

describe('messageTemplateAuditPolicy.details', () => {
  it('reports editable content fields that changed', () => {
    const before = {
      trigger: 'registration_confirmation',
      country: 'de',
      subject: 'Hi',
      body: '<p>a</p>',
      priority: 'normal',
    };
    const after = {
      trigger: 'registration_confirmation',
      country: 'de',
      subject: 'Hello',
      body: '<p>b</p>',
      priority: 'high',
    };

    // Fields are reported in allow-list order, not sorted.
    expect(policy.details(before, after)).toEqual({
      changedFields: ['subject', 'body', 'priority'],
      context: { trigger: 'registration_confirmation', country: 'de' },
    });
  });

  it('ignores fields outside the allow-list (id, eventId, updatedAt)', () => {
    const before = {
      trigger: 'registration_confirmation',
      country: 'de',
      subject: 'Hi',
      eventId: 'e1',
      updatedAt: '2026-06-01',
    };
    const after = {
      trigger: 'registration_confirmation',
      country: 'de',
      subject: 'Hi',
      eventId: 'e1',
      updatedAt: '2026-06-28',
    };

    // trigger/country are still attached — they identify the template even
    // when nothing else changed.
    expect(policy.details(before, after)).toEqual({
      context: { trigger: 'registration_confirmation', country: 'de' },
    });
  });
});
