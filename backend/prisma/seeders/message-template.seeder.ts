import { PrismaClient } from '@prisma/client';
import { MessageTemplateFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';

class MessageTemplateSeeder extends BaseSeeder {
  name(): string {
    return 'message-template';
  }

  async run(prisma: PrismaClient): Promise<void> {
    const camps = await prisma.camp.findMany();

    const events = [
      'registration_submitted',
      'registration_confirmed',
      'registration_waitlisted',
      'registration_waitlist_accepted',
      'registration_updated',
      'registration_canceled',
    ];

    // Delete templates from the camp factory first
    await prisma.messageTemplate.deleteMany({
      where: { campId: { in: camps.map((camp) => camp.id) } },
    });

    await Promise.all(
      camps.flatMap(async (camp) => {
        return events.map((event) => {
          return MessageTemplateFactory.create({
            camp: { connect: { id: camp.id } },
            event: event,
          });
        });
      }),
    );
  }
}

export default new MessageTemplateSeeder();
