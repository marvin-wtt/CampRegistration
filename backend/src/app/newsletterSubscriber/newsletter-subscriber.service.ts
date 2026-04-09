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

  async createSubscriber(
    newsletterId: string,
    data: { email: string; name?: string | null },
  ) {
    return this.prisma.newsletterSubscriber.create({
      data: {
        newsletterId,
        email: data.email,
        name: data.name ?? null,
        unsubscribeToken: generateUnsubscribeToken(),
      },
    });
  }

  async importSubscribersFromCamp(
    newsletterId: string,
    campId: string,
    country: string | null | undefined,
    requireConsent: boolean | undefined,
  ): Promise<{ added: number; skipped: number }> {
    const newsletterConsentWhere = requireConsent
      ? { newsletterConsent: true }
      : {
          OR: [{ newsletterConsent: true }, { newsletterConsent: null }],
        };

    const registrations = await this.prisma.registration.findMany({
      where: {
        campId,
        country,
        ...newsletterConsentWhere,
      },
      select: {
        emails: true,
        firstName: true,
        lastName: true,
      },
    });

    const seen = new Set<string>();
    const candidates: {
      newsletterId: string;
      email: string;
      name: string | null;
      unsubscribeToken: string;
    }[] = [];

    for (const registration of registrations) {
      const emails = registration.emails;
      if (!emails || emails.length === 0) {
        continue;
      }

      const name =
        [registration.firstName, registration.lastName]
          .filter(Boolean)
          .join(' ') || null;

      for (const email of emails) {
        if (!email || seen.has(email)) {
          continue;
        }
        seen.add(email);
        candidates.push({
          newsletterId,
          email,
          name,
          unsubscribeToken: generateUnsubscribeToken(),
        });
      }
    }

    const result = await this.prisma.newsletterSubscriber.createMany({
      data: candidates,
      skipDuplicates: true,
    });

    return { added: result.count, skipped: candidates.length - result.count };
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
