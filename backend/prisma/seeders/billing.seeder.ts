import type { EventBillStatus, Prisma } from '#generated/prisma/client.js';
import prisma from '../client';
import { BaseSeeder } from './BaseSeeder';
import { BILL_IDS, EVENT_IDS, ORGANIZATION_IDS, PRICE_MODEL_IDS } from './ids';
import { PHASE, seedDate } from './timeline';
import { calculateBillAmounts } from '#app/billing/billing.utils';

/**
 * One bill in every state, as the billing jobs would have left them. Amounts
 * come from the same calculation the finalize job uses, so the seeded totals
 * always agree with the price models.
 */
class BillingSeeder extends BaseSeeder {
  name(): string {
    return 'billing';
  }

  async run(): Promise<void> {
    // PAID: long past, counted the same at start and end.
    await this.finalized({
      id: BILL_IDS.winter,
      eventId: EVENT_IDS.winter,
      priceModelId: PRICE_MODEL_IDS.standard,
      start: 26,
      status: 'PAID',
      finalizedDaysAgo: -PHASE.past.end,
      paidDaysAgo: -PHASE.past.end - 21,
      note: 'Bank transfer received.',
    });

    // OPEN: two registrations were cancelled during the event, so the start
    // count is billed. Priced with the event's own override, not the
    // organization's Standard model.
    await this.finalized({
      id: BILL_IDS.spring,
      eventId: EVENT_IDS.spring,
      priceModelId: PRICE_MODEL_IDS.nonProfit,
      start: 24,
      status: 'OPEN',
      finalizedDaysAgo: -PHASE.recentlyEnded.end,
    });

    // DRAFT: the event is running; only the start count is known.
    const city = await this.event(EVENT_IDS.city);
    const cityAccepted = await this.accepted(EVENT_IDS.city);
    await prisma.eventBill.create({
      data: {
        id: BILL_IDS.city,
        eventId: city.id,
        organizationId: city.organizationId,
        startRegistrationCount: cityAccepted,
        eventName: city.name,
        eventStartAt: city.startAt,
        eventEndAt: city.endAt,
        eventTimezone: city.timezone,
        createdAt: city.startAt,
      },
    });

    // VOID: the bill of an event that was deleted while it ran, voided by an
    // administrator. It keeps its own copy of the event.
    const standard = await prisma.priceModel.findUniqueOrThrow({
      where: { id: PRICE_MODEL_IDS.standard },
    });
    await prisma.eventBill.create({
      data: {
        id: BILL_IDS.deleted,
        eventId: null,
        organizationId: ORGANIZATION_IDS.youthAdventures,
        priceModelId: standard.id,
        status: 'VOID',
        startRegistrationCount: 3,
        eventName: 'Test Event (deleted)',
        eventStartAt: seedDate(-40, '15:00'),
        eventEndAt: seedDate(-38, '10:00'),
        eventTimezone: 'Europe/Berlin',
        ...this.pricing(standard, 3),
        finalizedAt: seedDate(-38, '10:15'),
        voidedAt: seedDate(-37),
        note: 'Test event, created by mistake.',
        createdAt: seedDate(-40, '15:15'),
      },
    });
  }

  private async finalized(bill: {
    id: string;
    eventId: string;
    priceModelId: string;
    start: number;
    status: Extract<EventBillStatus, 'OPEN' | 'PAID'>;
    finalizedDaysAgo: number;
    paidDaysAgo?: number;
    note?: string;
  }): Promise<void> {
    const event = await this.event(bill.eventId);
    const end = await this.accepted(bill.eventId);
    const registrationCount = Math.max(bill.start, end);
    const priceModel = await prisma.priceModel.findUniqueOrThrow({
      where: { id: bill.priceModelId },
    });

    await prisma.eventBill.create({
      data: {
        id: bill.id,
        eventId: event.id,
        organizationId: event.organizationId,
        priceModelId: priceModel.id,
        status: bill.status,
        startRegistrationCount: bill.start,
        endRegistrationCount: end,
        eventName: event.name,
        eventStartAt: event.startAt,
        eventEndAt: event.endAt,
        eventTimezone: event.timezone,
        ...this.pricing(priceModel, registrationCount),
        finalizedAt: seedDate(-bill.finalizedDaysAgo, '10:15'),
        paidAt:
          bill.paidDaysAgo !== undefined ? seedDate(-bill.paidDaysAgo) : null,
        note: bill.note ?? null,
        createdAt: event.startAt,
      },
    });
  }

  private pricing(
    priceModel: Prisma.PriceModelGetPayload<object>,
    registrationCount: number,
  ) {
    return {
      currency: priceModel.currency,
      pricePerRegistration: priceModel.pricePerRegistration,
      baseFee: priceModel.baseFee,
      taxRate: priceModel.taxRate,
      ...calculateBillAmounts(priceModel, registrationCount),
    };
  }

  private event(id: string) {
    return prisma.event.findUniqueOrThrow({ where: { id } });
  }

  private accepted(eventId: string) {
    return prisma.registration.count({
      where: { eventId, status: 'ACCEPTED' },
    });
  }
}

export default new BillingSeeder();
