import type { Event, Prisma, Registration } from '#generated/prisma/client.js';
import prisma from '../client';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { PaymentSettings } from '@camp-registration/common/settings';
import { encryptSecret, secretsAvailable } from '#core/secrets';
import { ulid } from '#utils/ulid';
import { ORGANIZATION_IDS, USER_IDS } from './ids';
import { seedDate } from './timeline';

const settings = {
  enabled: true,
  timing: 'ACCEPTANCE',
  requestDate: null,
  requestDaysBeforeStart: null,
  reminderAfterDays: 7,
} satisfies PaymentSettings;

/**
 * What an accepted participant's payment history looks like, by position in
 * registration order — so every state shows up and reseeds stay comparable.
 */
type Scenario =
  | 'paidOnline'
  | 'paidByTransfer'
  | 'paidInCash'
  | 'partial'
  | 'unpaidReminded'
  | 'unpaid'
  | 'partlyRefunded'
  | 'refunded'
  | 'failedAttempt';

const CYCLE: Scenario[] = [
  'paidOnline',
  'paidOnline',
  'paidOnline',
  'paidOnline',
  'paidOnline',
  'paidByTransfer',
  'paidInCash',
  'partial',
  'unpaidReminded',
  'unpaid',
];

// Single cases worth seeing once, replacing the cycle at these positions.
const SPECIAL: Record<number, Scenario> = {
  0: 'partlyRefunded',
  10: 'refunded',
  19: 'failedAttempt',
};

// As the API snapshots it on every payment, for the ledger.
const payer = (registration: Registration) => ({
  payerName:
    [registration.firstName, registration.lastName].filter(Boolean).join(' ') ||
    null,
  registrationRef: registration.id,
});

/**
 * "Summer Camp" collects its fee online through Youth Adventures' fake
 * provider account: amounts due from the answers, a spread of payment states
 * across the accepted participants, and counselors whose fee a director
 * waived by hand.
 */
export class PaymentSeeder {
  constructor(private event: Event) {}

  async seed(): Promise<void> {
    await prisma.eventSetting.create({
      data: {
        event: { connect: { id: this.event.id } },
        key: SETTING_KEYS.PAYMENT,
        data: settings,
      },
    });
    await this.seedAccount();

    const registrations = await prisma.registration.findMany({
      where: { eventId: this.event.id },
      orderBy: { createdAt: 'asc' },
    });

    let participant = 0;
    for (const registration of registrations) {
      // The registration seeder stored what the form showed.
      const amountDue = registration.quotedAmount ?? 0;

      if (registration.role && registration.role !== 'participant') {
        await this.waive(registration);
      } else if (registration.status !== 'ACCEPTED') {
        // Not asked yet: pending ones may still be declined.
        continue;
      } else {
        const scenario =
          SPECIAL[participant] ?? CYCLE[participant % CYCLE.length]!;
        await this.seedHistory(registration, amountDue, scenario);
        participant++;
      }
    }
  }

  /** Skipped without SECRETS_ENCRYPTION_KEYS: credentials are never stored in plaintext. */
  private async seedAccount(): Promise<void> {
    if (!secretsAvailable()) {
      console.warn(
        'SECRETS_ENCRYPTION_KEYS is not set — seeding payments without a payment account.',
      );
      return;
    }

    await prisma.paymentAccount.create({
      data: {
        organizationId: ORGANIZATION_IDS.youthAdventures,
        provider: 'fake',
        mode: 'test',
        displayName: 'Fake payments',
        credentials: await encryptSecret(
          JSON.stringify({ apiKey: 'fake_seed' }),
          'payment-credentials',
        ),
      },
    });
  }

  private async waive(registration: Registration): Promise<void> {
    await this.update(registration, {
      amountDue: 0,
      amountDueAdjustedAt: seedDate(-25),
      amountDueNote: 'Counselor — no participation fee',
    });
    await this.audit(registration, 'amount_due_adjusted', -25, {
      amountDue: 0,
    });
  }

  private async seedHistory(
    registration: Registration,
    amountDue: number,
    scenario: Scenario,
  ): Promise<void> {
    await this.update(registration, {
      paymentRequestedAt: seedDate(-28),
      paymentReminderSentAt:
        scenario === 'unpaidReminded' ? seedDate(-7) : null,
    });
    await this.audit(registration, 'payment_requested', -28);

    switch (scenario) {
      case 'paidOnline':
        await this.online(registration, amountDue, 'PAID', -26);
        break;
      case 'paidByTransfer':
        await this.manual(registration, amountDue, 'bank_transfer', -21);
        break;
      case 'paidInCash':
        await this.manual(
          registration,
          amountDue,
          'cash',
          -14,
          'Paid at the info evening',
        );
        break;
      case 'partial':
        await this.manual(
          registration,
          amountDue / 2,
          'bank_transfer',
          -20,
          'First instalment',
        );
        break;
      case 'unpaidReminded':
      case 'unpaid':
        break;
      case 'partlyRefunded': {
        const payment = await this.online(registration, amountDue, 'PAID', -27);
        await this.refund(
          registration,
          payment,
          amountDue / 4,
          'Arrives two days late',
        );
        // A price reduction, so what is owed drops with it — as the refund
        // dialog does by default.
        await this.update(registration, {
          amountDue: amountDue - amountDue / 4,
          amountDueAdjustedAt: seedDate(-5),
          amountDueNote: 'Arrives two days late',
        });
        await this.audit(registration, 'amount_due_adjusted', -5, {
          amountDue: amountDue - amountDue / 4,
        });
        break;
      }
      case 'refunded': {
        const payment = await this.manual(
          registration,
          amountDue,
          'bank_transfer',
          -24,
        );
        await this.refund(
          registration,
          payment,
          amountDue,
          'Cancelled — illness',
        );
        break;
      }
      case 'failedAttempt':
        await this.online(registration, amountDue, 'FAILED', -25);
        break;
    }
  }

  private update(
    registration: Registration,
    data: Prisma.RegistrationUpdateInput,
  ) {
    return prisma.registration.update({
      where: { id: registration.id },
      data,
    });
  }

  // As the API files payment actions: on the registration, amounts in minor
  // units, no free text. Provider status changes have no actor.
  private async audit(
    registration: Registration,
    action: string,
    days: number,
    values: Record<string, string | number> = {},
    actorId: string | null = USER_IDS.john,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action,
        entityType: 'registration',
        entityId: registration.id,
        eventId: this.event.id,
        actorId,
        details: Object.keys(values).length > 0 ? { values } : undefined,
        createdAt: seedDate(days),
      },
    });
  }

  private async online(
    registration: Registration,
    amount: number,
    status: 'PAID' | 'FAILED',
    days: number,
  ) {
    await this.audit(
      registration,
      'payment_status_changed',
      days,
      { paymentStatus: status, amount },
      null,
    );
    return prisma.payment.create({
      data: {
        registrationId: registration.id,
        eventId: this.event.id,
        ...payer(registration),
        source: 'fake',
        providerPaymentId: `fake_${ulid()}`,
        status,
        amount,
        currency: this.event.currency,
        method: 'card',
        paidAt: status === 'PAID' ? seedDate(days) : null,
        createdAt: seedDate(days),
      },
    });
  }

  private async manual(
    registration: Registration,
    amount: number,
    method: string,
    days: number,
    note: string | null = null,
  ) {
    await this.audit(registration, 'payment_recorded', days, { amount });
    return prisma.payment.create({
      data: {
        registrationId: registration.id,
        eventId: this.event.id,
        ...payer(registration),
        source: 'manual',
        status: 'PAID',
        amount,
        currency: this.event.currency,
        method,
        note,
        paidAt: seedDate(days),
        createdById: USER_IDS.john,
        createdAt: seedDate(days),
      },
    });
  }

  private async refund(
    registration: Registration,
    payment: { id: string },
    amount: number,
    reason: string,
  ) {
    await this.audit(registration, 'payment_refunded', -5, { amount });
    return prisma.paymentRefund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: null,
        status: 'REFUNDED',
        amount,
        reason,
        notifyParticipant: true,
        createdById: USER_IDS.john,
        refundedAt: seedDate(-5),
        createdAt: seedDate(-5),
      },
    });
  }
}
