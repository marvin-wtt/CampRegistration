import { BaseSeeder } from './BaseSeeder';
import {
  NewsletterFactory,
  NewsletterMessageFactory,
  NewsletterSubscriberFactory,
} from '../factories';
import type { Prisma } from '#generated/prisma/client.js';
import { NEWSLETTER_IDS, ORGANIZATION_IDS, USER_IDS } from './ids';
import { seedDate } from './timeline';

class NewsletterSeeder extends BaseSeeder {
  name(): string {
    return 'newsletter';
  }

  async run(): Promise<void> {
    // OWNER: everything, including managing managers and deleting.
    await this.seedNewsletter({
      id: NEWSLETTER_IDS.campUpdates,
      organizationId: ORGANIZATION_IDS.youthAdventures,
      name: 'Camp Updates',
      description: 'General updates and news about upcoming camps.',
      managers: [
        { userId: USER_IDS.john, role: 'OWNER' },
        { userId: USER_IDS.peter, role: 'EDITOR' },
      ],
      subscribers: 120,
      messages: 3,
    });

    // EDITOR: may write and send, may not manage managers or delete.
    await this.seedNewsletter({
      id: NEWSLETTER_IDS.registrationReminders,
      organizationId: ORGANIZATION_IDS.youthAdventures,
      name: 'Registration Reminders',
      description: 'Reminders and deadlines for camp registrations.',
      managers: [
        { userId: USER_IDS.erika, role: 'OWNER' },
        { userId: USER_IDS.john, role: 'EDITOR' },
      ],
      subscribers: 5,
      messages: 0,
    });

    // VIEWER: sees subscribers and past messages, can send nothing.
    await this.seedNewsletter({
      id: NEWSLETTER_IDS.alumniDigest,
      organizationId: ORGANIZATION_IDS.youthAdventures,
      name: 'Alumni Digest',
      description: 'Quarterly digest for former participants.',
      managers: [
        { userId: USER_IDS.erika, role: 'OWNER' },
        { userId: USER_IDS.john, role: 'VIEWER' },
      ],
      subscribers: 42,
      messages: 2,
    });

    // No manager record at all. John reaches it only as an ADMIN of the owning
    // organization, which grants exactly ORGANIZATION_NEWSLETTER_PERMISSIONS:
    // the newsletter and its managers are visible, subscribers and messages are
    // not. It is listed under the organization, never under "my newsletters".
    await this.seedNewsletter({
      id: NEWSLETTER_IDS.boardAnnouncements,
      organizationId: ORGANIZATION_IDS.youthAdventures,
      name: 'Board Announcements',
      description: 'Internal announcements of the board.',
      managers: [{ userId: USER_IDS.erika, role: 'OWNER' }],
      subscribers: 14,
      messages: 1,
    });

    // Owned by a PENDING organization: sending is blocked at the send action.
    await this.seedNewsletter({
      id: NEWSLETTER_IDS.lettreInfo,
      organizationId: ORGANIZATION_IDS.nouvelleAssociation,
      name: "Lettre d'information",
      description: 'Actualités de la Nouvelle Association.',
      managers: [{ userId: USER_IDS.john, role: 'OWNER' }],
      subscribers: 8,
      messages: 0,
    });

    // Owned by the organization where John is a plain MEMBER: no access at all,
    // neither direct nor derived.
    await this.seedNewsletter({
      id: NEWSLETTER_IDS.alpineNews,
      organizationId: ORGANIZATION_IDS.alpineExplorers,
      name: 'Alpine News',
      description: 'Neuigkeiten der Alpine Explorers.',
      managers: [{ userId: USER_IDS.erika, role: 'OWNER' }],
      subscribers: 31,
      messages: 2,
    });
  }

  private async seedNewsletter(options: {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    managers: { userId: string; role: 'OWNER' | 'EDITOR' | 'VIEWER' }[];
    subscribers: number;
    messages: number;
  }): Promise<void> {
    const managers: Prisma.NewsletterManagerCreateWithoutNewsletterInput[] =
      options.managers.map(({ userId, role }) => ({
        user: { connect: { id: userId } },
        role,
      }));

    const newsletter = await NewsletterFactory.create({
      id: options.id,
      name: options.name,
      description: options.description,
      organization: { connect: { id: options.organizationId } },
      managers: { create: managers },
    });

    for (let i = 0; i < options.subscribers; i++) {
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        subscribedAt: seedDate(-subscribedDaysAgo(i)),
      });
    }

    const sender = options.managers[0]?.userId;
    for (let i = 0; i < options.messages; i++) {
      await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        recipientCount: options.subscribers,
        sentAt: seedDate(-(i + 1) * 14, '09:00'),
        ...(sender ? { sentBy: { connect: { id: sender } } } : {}),
      });
    }
  }
}

/** Spreads sign-ups over the past year so the list is not one single date. */
function subscribedDaysAgo(index: number): number {
  return (index * 7) % 365;
}

export default new NewsletterSeeder();
