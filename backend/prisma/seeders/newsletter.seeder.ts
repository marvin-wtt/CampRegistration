import { BaseSeeder } from './BaseSeeder';
import {
  NewsletterFactory,
  NewsletterMessageFactory,
  NewsletterSubscriberFactory,
} from '../factories';

class NewsletterSeeder extends BaseSeeder {
  name(): string {
    return 'newsletter';
  }

  async run(): Promise<void> {
    // Newsletter with subscribers and sent history
    const newsletter1 = await NewsletterFactory.create({
      name: 'Camp Updates',
      description: 'General updates and news about upcoming camps.',
      managers: {
        create: {
          userId: '01H4BK7J4WV75DZNAQBHMM99MA',
        },
      },
    });

    for (let i = 0; i < 12; i++) {
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter1.id } },
      });
    }

    for (let i = 0; i < 3; i++) {
      await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter1.id } },
      });
    }

    // Newsletter with subscribers but no sent messages
    const newsletter2 = await NewsletterFactory.create({
      name: 'Registration Reminders',
      description: 'Reminders and deadlines for camp registrations.',
      managers: {
        create: {
          userId: '01H4BK7J4WV75DZNAQBHMM99MA',
        },
      },
    });

    for (let i = 0; i < 5; i++) {
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter2.id } },
      });
    }
  }
}

export default new NewsletterSeeder();
