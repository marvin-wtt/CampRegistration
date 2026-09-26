import type { Event } from '#generated/prisma/client.js';
import { MessageFactory } from '../factories';
import prisma from '../client';
import { USER_IDS } from './ids';
import { seedDate } from './timeline';

interface SeededMessage {
  subject: string;
  body: string;
  count: number;
  sentByUserId: string;
  sentDaysAgo: number;
}

// Ad-hoc messages that were "sent" from the contact page (event === null).
const MESSAGES: SeededMessage[] = [
  {
    subject: 'Packing list for the summer camp',
    body: '<p>Hi there,</p><p>The event is approaching fast! Please make sure to pack rain gear, sturdy shoes, a refillable water bottle and any personal medication.</p><p>See you soon!</p>',
    count: 12,
    sentByUserId: USER_IDS.john,
    sentDaysAgo: 21,
  },
  {
    subject: 'Departure details & meeting point',
    body: '<p>Dear parents,</p><p>We will meet on Sunday at <strong>09:00</strong> in front of the main station. The bus leaves at 09:30 sharp.</p><p>Best regards,<br/>The event team</p>',
    count: 24,
    sentByUserId: USER_IDS.erika,
    sentDaysAgo: 9,
  },
  {
    subject: 'Reminder: outstanding payment',
    body: '<p>Hello,</p><p>Our records show that the participation fee has not been received yet. Please transfer the amount before the end of the week.</p><p>Thank you!</p>',
    count: 3,
    sentByUserId: USER_IDS.john,
    sentDaysAgo: 2,
  },
];

export class MessageSeeder {
  constructor(private event: Event) {}

  async seed(): Promise<void> {
    const registrations = await prisma.registration.findMany({
      where: { eventId: this.event.id, status: 'ACCEPTED' },
      take: 30,
    });

    if (registrations.length === 0) {
      return;
    }

    for (const message of MESSAGES) {
      const createdAt = seedDate(-message.sentDaysAgo, '10:00');

      const sentMessage = await MessageFactory.create({
        event: { connect: { id: this.event.id } },
        sentBy: { connect: { id: message.sentByUserId } },
        subject: message.subject,
        body: message.body,
        createdAt,
      });

      const recipients = registrations.slice(0, message.count);

      await prisma.messageDelivery.createMany({
        data: recipients.map((registration) => {
          const emails = registration.emails as string[] | null;

          return {
            messageId: sentMessage.id,
            registrationId: registration.id,
            to: emails?.[0] ?? null,
            subject: message.subject,
            body: message.body,
            createdAt,
          };
        }),
      });
    }
  }
}
