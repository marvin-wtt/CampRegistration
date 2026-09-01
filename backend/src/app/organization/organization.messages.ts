import type { Organization, User } from '#generated/prisma/client.js';
import { MailBase } from '#app/mail/mail.base';
import { generateUrl } from '#utils/url';

interface OrganizationRecipientPayload {
  organization: Organization;
  recipient: Pick<User, 'name' | 'email' | 'locale'>;
}

/** Addressed to one person; senders enqueue one payload per recipient. */
abstract class OrganizationMessage<
  T extends OrganizationRecipientPayload,
> extends MailBase<T> {
  protected to() {
    return {
      name: this.payload.recipient.name,
      address: this.payload.recipient.email,
    };
  }

  protected locale(): string | undefined {
    return this.payload.recipient.locale;
  }
}

/**
 * Tells system administrators an organization is waiting on them. Sent whenever
 * one enters PENDING — first submission, resubmission after a rejection, or a
 * verified organization editing its legal identity.
 */
export class OrganizationReviewPendingMessage extends OrganizationMessage<OrganizationRecipientPayload> {
  static readonly type = 'organization:review-pending';

  protected getTranslationOptions() {
    return {
      namespace: 'organization',
      keyPrefix: 'email.reviewPending',
    };
  }

  protected subject(): string {
    return this.getT()('subject', { organization: this.payload.organization });
  }

  protected content() {
    return {
      template: 'organization-review-pending',
      context: {
        organization: this.payload.organization,
        url: generateUrl(['administration', 'organizations']),
      },
    };
  }
}

export class OrganizationVerifiedMessage extends OrganizationMessage<OrganizationRecipientPayload> {
  static readonly type = 'organization:verified';

  protected getTranslationOptions() {
    return {
      namespace: 'organization',
      keyPrefix: 'email.verified',
    };
  }

  protected subject(): string {
    return this.getT()('subject', { organization: this.payload.organization });
  }

  protected content() {
    return {
      template: 'organization-verified',
      context: {
        organization: this.payload.organization,
        url: generateUrl([
          'management',
          'organizations',
          this.payload.organization.id,
        ]),
      },
    };
  }
}

/** Also covers revoking a previously verified organization. */
export class OrganizationRejectedMessage extends OrganizationMessage<OrganizationRecipientPayload> {
  static readonly type = 'organization:rejected';

  protected getTranslationOptions() {
    return {
      namespace: 'organization',
      keyPrefix: 'email.rejected',
    };
  }

  protected subject(): string {
    return this.getT()('subject', { organization: this.payload.organization });
  }

  protected content() {
    return {
      template: 'organization-rejected',
      context: {
        organization: this.payload.organization,
        url: generateUrl([
          'management',
          'organizations',
          this.payload.organization.id,
          'settings',
        ]),
      },
    };
  }
}
