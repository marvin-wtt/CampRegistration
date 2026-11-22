import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import crypto from 'crypto';
import {
  NEWSLETTER_CONFIRMATION_RESEND_COOLDOWN_MS,
  type NewsletterSubscriberImportResult,
} from '@camp-registration/common/entities';
import type { NewsletterSubscriber } from '#generated/prisma/client';

/** How long a confirmation link stays valid; pending entries are then deleted. */
const CONFIRMATION_VALID_DAYS = 30;

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function confirmationExpiry(): Date {
  return new Date(Date.now() - CONFIRMATION_VALID_DAYS * 24 * 60 * 60 * 1000);
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

  async getConfirmedSubscribers(newsletterId: string) {
    return this.prisma.newsletterSubscriber.findMany({
      where: { newsletterId, confirmedAt: { not: null } },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  /** A still valid confirmation link; confirmed subscribers keep theirs. */
  async getSubscriberByConfirmationToken(token: string) {
    return this.prisma.newsletterSubscriber.findFirst({
      where: {
        confirmationToken: token,
        OR: [
          { confirmedAt: { not: null } },
          { confirmationSentAt: { gte: confirmationExpiry() } },
        ],
      },
      include: {
        newsletter: {
          select: { name: true, organization: { select: { name: true } } },
        },
      },
    });
  }

  async createPendingSubscriber(
    newsletterId: string,
    data: {
      email: string;
      name?: string | null;
      locale?: string | null;
      consentedAt?: Date;
    },
  ) {
    return this.prisma.newsletterSubscriber.create({
      data: {
        newsletterId,
        email: data.email,
        name: data.name ?? null,
        locale: data.locale ?? null,
        consentedAt: data.consentedAt ?? new Date(),
        unsubscribeToken: generateToken(),
        confirmationToken: generateToken(),
        confirmationSentAt: new Date(),
      },
    });
  }

  /**
   * Adds every consenting registration of the event as a pending subscriber
   * and returns the new rows, so only they are sent a confirmation.
   */
  async importSubscribersFromEvent(
    newsletterId: string,
    eventId: string,
    group: string | null | undefined,
  ): Promise<
    NewsletterSubscriberImportResult & { created: NewsletterSubscriber[] }
  > {
    const registrations = await this.prisma.registration.findMany({
      where: {
        eventId,
        // The registrations' group, not where people live.
        group,
        // Only a consent the form recorded is a basis for sending (Art. 6(1)(a)).
        newsletterConsent: true,
      },
      select: {
        emails: true,
        firstName: true,
        lastName: true,
        locale: true,
        createdAt: true,
      },
      // The earliest registration's consent wins for a shared address.
      orderBy: { createdAt: 'asc' },
    });

    const seen = new Set<string>();
    const now = new Date();
    const candidates: {
      newsletterId: string;
      email: string;
      name: string | null;
      locale: string;
      consentedAt: Date;
      unsubscribeToken: string;
      confirmationToken: string;
      confirmationSentAt: Date;
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
          locale: registration.locale,
          consentedAt: registration.createdAt,
          unsubscribeToken: generateToken(),
          confirmationToken: generateToken(),
          confirmationSentAt: now,
        });
      }
    }

    const result = await this.prisma.newsletterSubscriber.createMany({
      data: candidates,
      skipDuplicates: true,
    });

    // MariaDB has no createManyAndReturn; the fresh tokens find the new rows.
    const created =
      result.count > 0
        ? await this.prisma.newsletterSubscriber.findMany({
            where: {
              confirmationToken: {
                in: candidates.map((c) => c.confirmationToken),
              },
            },
          })
        : [];

    return {
      added: result.count,
      skipped: candidates.length - result.count,
      created,
    };
  }

  /** Whether the cooldown since the last confirmation mail has passed. */
  canResendConfirmation(subscriber: NewsletterSubscriber): boolean {
    if (!subscriber.confirmationSentAt) {
      return true;
    }

    return (
      Date.now() - subscriber.confirmationSentAt.getTime() >=
      NEWSLETTER_CONFIRMATION_RESEND_COOLDOWN_MS
    );
  }

  /** Issues a new link, so a mail sent earlier no longer confirms. */
  async renewConfirmation(id: string) {
    return this.prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        confirmationToken: generateToken(),
        confirmationSentAt: new Date(),
      },
    });
  }

  async confirm(id: string) {
    return this.prisma.newsletterSubscriber.update({
      where: { id },
      data: { confirmedAt: new Date() },
    });
  }

  async deleteExpiredPendingSubscribers(): Promise<number> {
    const result = await this.prisma.newsletterSubscriber.deleteMany({
      where: {
        confirmedAt: null,
        confirmationSentAt: { lt: confirmationExpiry() },
      },
    });

    return result.count;
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
