import type { User } from '#generated/prisma/client.js';
import type { Translatable } from '@camp-registration/common/entities';
import { MailBase } from '#core/mail/mail.base';
import { generateUrl } from '#utils/url';
import { translateObject } from '#utils/translateObject';
import { resolveActionCardText } from '#core/mail/actionCardText';
import { BILLING_TIME_ZONE } from '#app/billing/billing.utils';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

type Recipient = Pick<User, 'name' | 'email' | 'locale'>;

/** A model as the emails quote it; plain data, since mails are queued. */
interface QuotedModel {
  name: Translatable;
  currency: string;
  pricePerRegistration: string;
  baseFee: string;
  taxRate: string;
}

interface PriceModelPayload {
  organization: { id: string; name: string };
  priceModel: QuotedModel;
  recipient: Recipient;
}

abstract class PriceModelMail<T extends PriceModelPayload> extends MailBase<T> {
  /** The translation block under `email.`. */
  protected abstract key(): string;

  protected to() {
    return {
      name: this.payload.recipient.name,
      address: this.payload.recipient.email,
    };
  }

  protected locale(): string | undefined {
    return this.payload.recipient.locale;
  }

  protected getTranslationOptions() {
    return { namespace: 'organization', keyPrefix: `email.${this.key()}` };
  }

  protected vars(): Record<string, unknown> {
    const { organization, priceModel } = this.payload;
    const money = (amount: string) =>
      new Intl.NumberFormat(this.locale(), {
        style: 'currency',
        currency: priceModel.currency,
      }).format(Number(amount));

    return {
      organization,
      model: {
        name: translateObject(priceModel.name, this.locale()),
        price: money(priceModel.pricePerRegistration),
        baseFee: money(priceModel.baseFee),
        taxRate: Number(priceModel.taxRate).toLocaleString(this.locale()),
      },
    };
  }

  protected abstract url(): string;

  protected subject(): string {
    return this.getT()('subject', this.vars());
  }

  protected content() {
    return {
      template: 'price-model',
      context: {
        ...resolveActionCardText(this.getT(), this.vars()),
        url: this.url(),
      } satisfies LocalContext<ActionCardProps>,
    };
  }

  protected billingUrl(): string {
    return generateUrl([
      'management',
      'organizations',
      this.payload.organization.id,
      'billing',
    ]);
  }
}

/** Asks an organization's administrators to accept a price increase. */
export class PriceModelOfferedMessage extends PriceModelMail<
  PriceModelPayload & { effectiveAt: string }
> {
  static readonly type = 'price-model:offered';
  protected key() {
    return 'priceModelOffered';
  }

  protected vars() {
    const date = new Intl.DateTimeFormat(this.locale(), {
      dateStyle: 'short',
      timeZone: BILLING_TIME_ZONE,
    }).format(new Date(this.payload.effectiveAt));

    return { ...super.vars(), date };
  }

  protected url() {
    return this.billingUrl();
  }
}

/** Tells an organization's administrators their price went down. */
export class PriceModelLoweredMessage extends PriceModelMail<PriceModelPayload> {
  static readonly type = 'price-model:lowered';
  protected key() {
    return 'priceModelLowered';
  }

  protected url() {
    return this.billingUrl();
  }
}
