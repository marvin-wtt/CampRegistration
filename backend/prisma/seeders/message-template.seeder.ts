import { Camp } from '#generated/prisma/client.js';
import { MessageTemplateFactory } from '../factories';
import prisma from '../client';

interface SeededMessage {
  subject: string;
  body: string;
  count: number;
}

// Ad-hoc messages that were "sent" from the contact page (event === null).
const MESSAGES: SeededMessage[] = [
  {
    subject: 'Packing list for the summer camp',
    body: '<p>Hi there,</p><p>The camp is approaching fast! Please make sure to pack rain gear, sturdy shoes, a refillable water bottle and any personal medication.</p><p>See you soon!</p>',
    count: 12,
  },
  {
    subject: 'Departure details & meeting point',
    body: '<p>Dear parents,</p><p>We will meet on Sunday at <strong>09:00</strong> in front of the main station. The bus leaves at 09:30 sharp.</p><p>Best regards,<br/>The camp team</p>',
    count: 24,
  },
  {
    subject: 'Reminder: outstanding payment',
    body: '<p>Hello,</p><p>Our records show that the participation fee has not been received yet. Please transfer the amount before the end of the week.</p><p>Thank you!</p>',
    count: 3,
  },
];

export class MessageTemplateSeeder {
  constructor(private camp: Camp) {}

  async seed(): Promise<void> {
    const registrations = await prisma.registration.findMany({
      where: { campId: this.camp.id, status: 'ACCEPTED' },
      take: 30,
    });

    if (registrations.length === 0) {
      return;
    }

    for (const message of MESSAGES) {
      const template = await MessageTemplateFactory.create({
        camp: { connect: { id: this.camp.id } },
        event: null,
        country: null,
        subject: message.subject,
        body: message.body,
      });

      const recipients = registrations.slice(0, message.count);

      await prisma.message.createMany({
        data: recipients.map((registration) => {
          const emails = registration.emails as string[] | null;

          return {
            templateId: template.id,
            registrationId: registration.id,
            to: emails?.[0] ?? null,
            subject: message.subject,
            body: message.body,
          };
        }),
      });
    }
  }
}
