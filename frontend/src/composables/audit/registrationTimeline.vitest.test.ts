import { describe, expect, it } from 'vitest';
import type { MessageDelivery } from '@camp-registration/common/entities';
import { groupDeliveries } from '@/composables/audit/registrationTimeline';

function delivery(overrides: Partial<MessageDelivery>): MessageDelivery {
  return {
    id: 'd',
    to: 'a@example.com',
    cc: null,
    bcc: null,
    replyTo: null,
    subject: 'Subject',
    body: 'Body',
    priority: 'normal',
    createdAt: '2026-06-01T10:00:05.000Z',
    attachments: null,
    bouncedAt: null,
    bounceReason: null,
    messageId: null,
    batchId: null,
    trigger: null,
    sentBy: null,
    ...overrides,
  };
}

describe('groupDeliveries', () => {
  it('merges the per-address deliveries of one manual message', () => {
    const emails = groupDeliveries(
      [
        delivery({ id: '1', messageId: 'm1', to: 'a@example.com' }),
        delivery({ id: '2', messageId: 'm1', to: 'b@example.com' }),
        delivery({ id: '3', messageId: 'm2' }),
      ],
      'reg',
    );

    expect(emails).toHaveLength(2);
    expect(
      emails[0]?.message.recipients?.[0]?.deliveries.map((d) => d.to),
    ).toEqual(['a@example.com', 'b@example.com']);
    expect(emails[0]?.message.recipients?.[0]?.registrationId).toBe('reg');
  });

  it('groups by batch, keeping repeated sends of one trigger apart', () => {
    const emails = groupDeliveries(
      [
        delivery({ id: '1', trigger: 'registration_updated', batchId: 'b1' }),
        delivery({ id: '2', trigger: 'registration_updated', batchId: 'b1' }),
        delivery({ id: '3', trigger: 'registration_updated', batchId: 'b2' }),
      ],
      'reg',
    );

    expect(emails).toHaveLength(2);
  });

  it('falls back to trigger and minute for deliveries without a batch', () => {
    const emails = groupDeliveries(
      [
        delivery({ id: '1', trigger: 'registration_submitted' }),
        delivery({
          id: '2',
          trigger: 'registration_submitted',
          createdAt: '2026-06-01T10:00:40.000Z',
        }),
        delivery({ id: '3', trigger: 'registration_confirmed' }),
      ],
      'reg',
    );

    expect(emails.map((email) => email.trigger)).toEqual([
      'registration_submitted',
      'registration_confirmed',
    ]);
  });

  it('keeps a resent message apart from the original send', () => {
    const emails = groupDeliveries(
      [
        delivery({ id: '1', messageId: 'm1', batchId: 'b2' }),
        delivery({ id: '2', messageId: 'm1', batchId: 'b1' }),
      ],
      'reg',
    );

    expect(emails).toHaveLength(2);
  });

  it('is resendable only while its message or template exists', () => {
    const emails = groupDeliveries(
      [
        delivery({ id: '1', messageId: 'm1', batchId: 'b1' }),
        delivery({ id: '2', trigger: 'registration_confirmed', batchId: 'b2' }),
        delivery({ id: '3', batchId: 'b3' }),
      ],
      'reg',
    );

    expect(emails.map((email) => email.resendable)).toEqual([
      true,
      true,
      false,
    ]);
  });
});
