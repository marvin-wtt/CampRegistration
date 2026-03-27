import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import crypto from 'crypto';

function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

@injectable()
export class NewsletterSubscriberService extends BaseService {
  async getSubscriberById(newsletterId: string, id: string) {
    return this.prisma.newsletterSubscriber.findFirst({
      where: { id, newsletterId },
    });
  }

  async getSubscriberByToken(token: string) {
    return this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });
  }

  async getSubscriberByEmail(newsletterId: string, email: string) {
    return this.prisma.newsletterSubscriber.findUnique({
      where: { newsletterId_email: { newsletterId, email } },
    });
  }

  async getSubscribers(newsletterId: string) {
    return this.prisma.newsletterSubscriber.findMany({
      where: { newsletterId },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async addSubscriber(
    newsletterId: string,
    data: { email: string; name?: string | null; country?: string | null },
  ) {
    return this.prisma.newsletterSubscriber.create({
      data: {
        newsletterId,
        email: data.email,
        name: data.name ?? null,
        country: data.country ?? null,
        unsubscribeToken: generateUnsubscribeToken(),
      },
    });
  }

  async upsertSubscriber(
    newsletterId: string,
    data: { email: string; name?: string | null; country?: string | null },
  ) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: {
        newsletterId_email: { newsletterId, email: data.email },
      },
    });

    if (existing) {
      return existing;
    }

    return this.addSubscriber(newsletterId, data);
  }

  async importSubscribersFromCamp(
    newsletterId: string,
    campId: string,
    country: string | null | undefined,
  ): Promise<{ added: number; skipped: number }> {
    const registrations = await this.prisma.registration.findMany({
      where: {
        campId,
        ...(country ? { country } : {}),
        deletedAt: null,
      },
      select: { emails: true, firstName: true, lastName: true, country: true },
    });

    let added = 0;
    let skipped = 0;

    for (const registration of registrations) {
      const emails = registration.emails;
      if (!emails || emails.length === 0) continue;

      const name =
        [registration.firstName, registration.lastName]
          .filter(Boolean)
          .join(' ') || null;

      for (const email of emails) {
        if (!email) continue;
        const existing = await this.prisma.newsletterSubscriber.findUnique({
          where: {
            newsletterId_email: { newsletterId, email },
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await this.prisma.newsletterSubscriber.create({
          data: {
            newsletterId,
            email,
            name,
            country: registration.country ?? null,
            unsubscribeToken: generateUnsubscribeToken(),
          },
        });
        added++;
      }
    }

    return { added, skipped };
  }

  async removeSubscriber(id: string) {
    return this.prisma.newsletterSubscriber.delete({ where: { id } });
  }

  async unsubscribeByToken(token: string) {
    return this.prisma.newsletterSubscriber.delete({
      where: { unsubscribeToken: token },
    });
  }
}
