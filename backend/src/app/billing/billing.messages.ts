import type { User } from '#generated/prisma/client.js';
import type { Translatable } from '@camp-registration/common/entities';
import { MailBase } from '#core/mail/mail.base';
import { generateUrl } from '#utils/url';
import { translateObject } from '#utils/translateObject';
import { resolveActionCardText } from '#core/mail/actionCardText';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

interface InvoiceIssuedPayload {
  organization: { id: string; name: string };
  bill: { eventName: Translatable; grossAmount: string; currency: string };
  recipient: Pick<User, 'name' | 'email' | 'locale'>;
}

/** Tells an organization's administrators a bill's invoice is ready to pay. */
export class InvoiceIssuedMessage extends MailBase<InvoiceIssuedPayload> {
  static readonly type = 'billing:invoice-issued';

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
    return {
      namespace: 'organization',
      keyPrefix: 'email.invoiceIssued',
    };
  }

  private vars() {
    const { bill, organization } = this.payload;
    const amount = new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: bill.currency,
    }).format(Number(bill.grossAmount));

    return {
      organization,
      event: { name: translateObject(bill.eventName, this.locale()) },
      amount,
    };
  }

  protected subject(): string {
    return this.getT()('subject', this.vars());
  }

  protected content() {
    return {
      template: 'invoice-issued',
      context: {
        ...resolveActionCardText(this.getT(), this.vars()),
        url: generateUrl([
          'management',
          'organizations',
          this.payload.organization.id,
          'billing',
        ]),
      } satisfies LocalContext<ActionCardProps>,
    };
  }
}
