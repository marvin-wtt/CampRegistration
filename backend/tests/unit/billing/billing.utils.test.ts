import { describe, expect, it } from 'vitest';
import { Prisma, type EventBill } from '#generated/prisma/client';
import {
  billedRegistrationCount,
  calculateBillAmounts,
  eventInstant,
} from '#app/billing/billing.utils';
import { BillingService } from '#app/billing/billing.service';

const pricing = (price: string, baseFee: string, taxRate: string) => ({
  pricePerRegistration: new Prisma.Decimal(price),
  baseFee: new Prisma.Decimal(baseFee),
  taxRate: new Prisma.Decimal(taxRate),
});

describe('billedRegistrationCount', () => {
  const counts = (
    start: number,
    end: number | null,
    adjusted: number | null,
  ) => ({
    startRegistrationCount: start,
    endRegistrationCount: end,
    adjustedRegistrationCount: adjusted,
  });

  it('bills the higher of the measured counts', () => {
    expect(billedRegistrationCount(counts(3, 5, null))).toBe(5);
    expect(billedRegistrationCount(counts(5, 3, null))).toBe(5);
  });

  it('bills the start count while the end count is unknown', () => {
    expect(billedRegistrationCount(counts(4, null, null))).toBe(4);
  });

  it('lets a correction override the measured counts', () => {
    expect(billedRegistrationCount(counts(5, 6, 2))).toBe(2);
  });
});

describe('calculateBillAmounts', () => {
  it('adds the base fee to the per-registration price and applies tax', () => {
    const amounts = calculateBillAmounts(pricing('2.00', '10.00', '19.00'), 3);

    expect(amounts.netAmount.toFixed(2)).toBe('16.00');
    expect(amounts.taxAmount.toFixed(2)).toBe('3.04');
    expect(amounts.grossAmount.toFixed(2)).toBe('19.04');
  });

  it('rounds tax half-up to the cent, so net + tax is exactly gross', () => {
    // 0.35 × 7% = 0.0245 → 0.02; 0.50 × 7% = 0.035 → 0.04 (half-up, not banker's)
    expect(
      calculateBillAmounts(pricing('0.50', '0', '7.00'), 1).taxAmount.toFixed(
        2,
      ),
    ).toBe('0.04');

    const amounts = calculateBillAmounts(pricing('1.99', '0.01', '19.00'), 7);
    expect(
      amounts.netAmount.plus(amounts.taxAmount).equals(amounts.grossAmount),
    ).toBe(true);
  });

  it('charges only the base fee without registrations', () => {
    const amounts = calculateBillAmounts(pricing('5.00', '25.00', '0'), 0);

    expect(amounts.grossAmount.toFixed(2)).toBe('25.00');
  });

  it('is zero for a free model', () => {
    const amounts = calculateBillAmounts(pricing('0', '0', '19.00'), 120);

    expect(amounts.grossAmount.isZero()).toBe(true);
  });
});

describe('eventInstant', () => {
  it('reads the stored digits as wall-clock time in the event timezone', () => {
    // 09:00 in Berlin in winter is 08:00 UTC
    const carrier = new Date(Date.UTC(2026, 0, 15, 9, 0, 0));

    expect(eventInstant(carrier, 'Europe/Berlin').toISOString()).toBe(
      '2026-01-15T08:00:00.000Z',
    );
  });

  it('follows daylight saving time', () => {
    // 09:00 in Berlin in summer is 07:00 UTC
    const carrier = new Date(Date.UTC(2026, 6, 1, 9, 0, 0));

    expect(eventInstant(carrier, 'Europe/Berlin').toISOString()).toBe(
      '2026-07-01T07:00:00.000Z',
    );
  });
});

describe('BillingService.updateBill', () => {
  const service = new BillingService();
  const bill = (status: EventBill['status']) =>
    ({ id: '01K6B0000000000000000BILL1', status }) as EventBill;

  it.each([
    ['DRAFT', 'PAID'],
    ['DRAFT', 'VOID'],
    ['VOID', 'PAID'],
  ] as const)('refuses %s → %s', async (from, to) => {
    await expect(
      service.updateBill(bill(from), { status: to }),
    ).rejects.toThrow(`A ${from} bill cannot become ${to}.`);
  });
});
