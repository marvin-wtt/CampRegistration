import { inject, injectable } from 'inversify';
import type {
  Event,
  Prisma,
  Registration,
  RegistrationStatus,
} from '#generated/prisma/client.js';
import type {
  PaymentSettlement,
  RegistrationCreatePaymentMeta,
  RegistrationPaymentDetails,
} from '@camp-registration/common/entities';
import { registrationPayment } from '@camp-registration/common/utils';
import {
  balanceSelect,
  type EventWithOrganization,
  PaymentService,
} from './payment.service.js';
import { PaymentCollectionService } from './payment-collection.service.js';

/** A registration with what `registrationPaymentInclude` loads. */
export type RegistrationWithPayments = Registration & {
  payments?: Prisma.PaymentGetPayload<{ select: typeof balanceSelect }>[];
  event?: { currency: string };
};

/** Load with a registration to `present` its balance. */
export const registrationPaymentInclude = {
  payments: { select: balanceSelect },
  event: { select: { id: true, currency: true } },
} satisfies Prisma.RegistrationInclude;

/** Who is deleting, and whether they may settle money the registration holds. */
export interface DeletionActor {
  userId: string | null;
  /** Holds `event.payments.refund`. */
  maySettle: boolean;
}

/**
 * Everything the registration module needs from payments, in one place: the
 * balance it shows and the lifecycle steps it hands over. Registration code
 * depends on this, never on the payment services behind it.
 */
@injectable()
export class RegistrationPayments {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(PaymentCollectionService)
    private readonly collection: PaymentCollectionService,
  ) {}

  /**
   * The registration's balance as managers see it, or `null` for whoever may
   * not see payment data (`event.payments.view`).
   */
  present(
    registration: RegistrationWithPayments,
    visible: boolean,
  ): RegistrationPaymentDetails | null {
    if (!visible) {
      return null;
    }

    return {
      ...registrationPayment(
        registration.amountDue,
        registration.event?.currency ?? 'EUR',
        registration.payments ?? [],
      ),
      quotedAmount: registration.quotedAmount,
      requestedAt: registration.paymentRequestedAt?.toISOString() ?? null,
      remindedAt: registration.paymentReminderSentAt?.toISOString() ?? null,
      heldAt: registration.paymentHoldAt?.toISOString() ?? null,
      adjustment: registration.amountDueAdjustedAt
        ? {
            note: registration.amountDueNote,
            adjustedAt: registration.amountDueAdjustedAt.toISOString(),
          }
        : null,
    };
  }

  /** A new registration: asked to pay, with a checkout when accepted at once. */
  created(
    event: EventWithOrganization,
    registration: Registration,
  ): Promise<RegistrationCreatePaymentMeta | null> {
    return this.collection.forNewRegistration(event, registration);
  }

  statusChanged(
    event: EventWithOrganization,
    previous: RegistrationStatus,
    registration: Registration,
    options: { notify: boolean },
  ): Promise<void> {
    return this.collection.statusChanged(
      event,
      previous,
      registration,
      options,
    );
  }

  /**
   * Inside the deletion's transaction: settles money still held and closes
   * open checkouts. Returns the settlement applied, if any.
   */
  beforeDelete(
    event: Pick<Event, 'organizationId' | 'currency'>,
    registration: Registration,
    settlement: PaymentSettlement | undefined,
    actor: DeletionActor,
  ): Promise<PaymentSettlement | null> {
    return this.paymentService.settleForDeletion(
      event,
      registration,
      settlement,
      actor,
    );
  }
}
