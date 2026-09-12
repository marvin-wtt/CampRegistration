import { describe, expect, it } from 'vitest';
import { MessageResource } from '#app/message/message.resource';
import type { MessageWithFiles } from '#app/message/message.resource';

function baseMessage(
  deliveries: MessageWithFiles['deliveries'],
): MessageWithFiles {
  return {
    id: 'message-1',
    subject: 'Subject',
    body: 'Body',
    replyTo: null,
    priority: 'normal',
    eventId: 'event-1',
    sentByUserId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    attachments: [],
    sentBy: null,
    deliveries,
  } as unknown as MessageWithFiles;
}

describe('MessageResource recipients', () => {
  it('groups multiple per-email deliveries under one recipient per registration', () => {
    const message = baseMessage([
      {
        registrationId: 'reg-1',
        to: 'a@example.com',
        bouncedAt: null,
        bounceReason: null,
      },
      {
        registrationId: 'reg-1',
        to: 'b@example.com',
        bouncedAt: null,
        bounceReason: null,
      },
    ]);

    const { recipients } = new MessageResource(message).transform();

    expect(recipients).toHaveLength(1);
    expect(recipients?.[0]?.registrationId).toBe('reg-1');
    expect(recipients?.[0]?.deliveries).toEqual([
      { to: 'a@example.com', bouncedAt: null, bounceReason: null },
      { to: 'b@example.com', bouncedAt: null, bounceReason: null },
    ]);
  });

  it('keeps each delivery separate so it is clear which address bounced', () => {
    const bouncedAt = new Date('2026-01-02T00:00:00.000Z');
    const message = baseMessage([
      {
        registrationId: 'reg-1',
        to: 'a@example.com',
        bouncedAt: null,
        bounceReason: null,
      },
      {
        registrationId: 'reg-1',
        to: 'b@example.com',
        bouncedAt,
        bounceReason: 'Rejected by the recipient server',
      },
    ]);

    const { recipients } = new MessageResource(message).transform();

    expect(recipients).toEqual([
      {
        registrationId: 'reg-1',
        deliveries: [
          { to: 'a@example.com', bouncedAt: null, bounceReason: null },
          {
            to: 'b@example.com',
            bouncedAt: bouncedAt.toISOString(),
            bounceReason: 'Rejected by the recipient server',
          },
        ],
      },
    ]);
  });

  it('reports a delivery as unbounced when it never bounced', () => {
    const message = baseMessage([
      {
        registrationId: 'reg-1',
        to: 'a@example.com',
        bouncedAt: null,
        bounceReason: null,
      },
    ]);

    const { recipients } = new MessageResource(message).transform();

    expect(recipients?.[0]?.deliveries).toEqual([
      { to: 'a@example.com', bouncedAt: null, bounceReason: null },
    ]);
  });

  it('separates deliveries for different registrations', () => {
    const message = baseMessage([
      {
        registrationId: 'reg-1',
        to: 'a@example.com',
        bouncedAt: null,
        bounceReason: null,
      },
      {
        registrationId: 'reg-2',
        to: 'c@example.com',
        bouncedAt: null,
        bounceReason: null,
      },
    ]);

    const { recipients } = new MessageResource(message).transform();

    expect(recipients?.map((r) => r.registrationId)).toEqual([
      'reg-1',
      'reg-2',
    ]);
  });
});
