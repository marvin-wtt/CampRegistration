import moment from 'moment';
import type { PrismaClient } from '#generated/prisma/client.js';
import { BaseSeeder } from './BaseSeeder';
import { EVENT_IDS, USER_IDS } from './ids';

/**
 * Registration fees in every state the fees view shows, in a fixed rotation
 * over the accepted registrations, so a reseed looks the same.
 */
type FeeScenario =
  | 'unpaid'
  | 'deposit'
  | 'transfer'
  | 'cash'
  | 'overpaid'
  | 'cancelled'
  | 'adjusted';

const ROTATION: FeeScenario[] = [
  'transfer',
  'deposit',
  'transfer',
  'unpaid',
  'cash',
  'transfer',
  'overpaid',
  'transfer',
  'adjusted',
  'cancelled',
];

class PaymentSeeder extends BaseSeeder {
  name(): string {
    return 'payment';
  }

  async run(prisma: PrismaClient): Promise<void> {
    await this.seedFees(prisma, EVENT_IDS.spring);
    await this.seedFees(prisma, EVENT_IDS.summer);
  }

  private async seedFees(prisma: PrismaClient, eventId: string) {
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { startAt: true, currency: true },
    });
    const registrations = await prisma.registration.findMany({
      where: { eventId, status: 'ACCEPTED', quotedAmount: { gt: 0 } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const day = (offset: number) =>
      moment.utc(event.startAt).add(offset, 'days').format('YYYY-MM-DD');

    for (const [index, registration] of registrations.entries()) {
      const due = registration.quotedAmount ?? 0;
      const scenario = ROTATION[index % ROTATION.length]!;
      const base = {
        eventId,
        registrationId: registration.id,
        registrationRef: registration.id,
        payerName: [registration.firstName, registration.lastName]
          .filter(Boolean)
          .join(' '),
        currency: registration.currency ?? event.currency,
        createdByUserId: USER_IDS.john,
      };
      const pay = (amount: number, offset: number, method = 'BANK_TRANSFER') =>
        prisma.payment.create({
          data: {
            ...base,
            amount,
            method: method as 'BANK_TRANSFER' | 'CASH',
            paidOn: day(offset),
          },
        });

      switch (scenario) {
        case 'unpaid':
          break;
        case 'deposit':
          await pay(Math.round(due / 2), -40);
          break;
        case 'transfer':
          await pay(due, -30 + (index % 20));
          break;
        case 'cash':
          await pay(due, 0, 'CASH');
          break;
        case 'overpaid': {
          // The same transfer twice.
          await pay(due, -25);
          await pay(due, -24);
          break;
        }
        case 'adjusted':
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              amountDueOverride: Math.round(due * 0.8),
              amountDueNote: 'Sibling discount',
              amountDueAdjustedAt: moment
                .utc(event.startAt)
                .subtract(50, 'days')
                .toDate(),
            },
          });
          await pay(Math.round(due * 0.8), -20);
          break;
        case 'cancelled': {
          // Paid, then cancelled with a cancellation fee kept.
          const payment = await pay(due, -45);
          const fee = Math.round(due * 0.2);
          await prisma.paymentRefund.create({
            data: {
              paymentId: payment.id,
              amount: due - fee,
              amountDueReduction: due - fee,
              refundedOn: day(-15),
              reason: 'Cancelled, fee kept',
              createdByUserId: USER_IDS.john,
            },
          });
          break;
        }
      }
    }
  }
}

export default new PaymentSeeder();
