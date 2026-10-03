import { describe, expect, it } from 'vitest';
import { Prisma } from '#generated/prisma/client';
import {
  billingYears,
  summarizeByMonth,
  summarizeTotals,
  yearMonths,
  type SummarizedBill,
} from '#app/billing/billing.summary';

const MONTHS = ['2026-08', '2026-09', '2026-10'];

function bill(data: Partial<SummarizedBill>): SummarizedBill {
  return {
    status: 'OPEN',
    currency: 'EUR',
    finalizedAt: new Date('2026-09-10T10:00:00Z'),
    paidAt: null,
    netAmount: new Prisma.Decimal('10.00'),
    taxAmount: new Prisma.Decimal('1.90'),
    grossAmount: new Prisma.Decimal('11.90'),
    ...data,
  };
}

const row = (rows: ReturnType<typeof summarizeByMonth>, month: string) =>
  rows.find((entry) => entry.month === month && entry.currency === 'EUR');

describe('summarizeByMonth', () => {
  it('lists every month newest first, empty ones as zero', () => {
    const rows = summarizeByMonth([bill({})], MONTHS, 'UTC');

    expect(rows.map((entry) => entry.month)).toEqual([
      '2026-10',
      '2026-09',
      '2026-08',
    ]);
    expect(row(rows, '2026-10')).toMatchObject({
      bills: 0,
      grossAmount: '0.00',
    });
  });

  it('counts billing by the finalization month and payments by the payment month', () => {
    const rows = summarizeByMonth(
      [
        bill({ status: 'PAID', paidAt: new Date('2026-10-02T09:00:00Z') }),
        bill({}),
      ],
      MONTHS,
      'UTC',
    );

    expect(row(rows, '2026-09')).toMatchObject({
      bills: 2,
      netAmount: '20.00',
      taxAmount: '3.80',
      grossAmount: '23.80',
      receivedAmount: '0.00',
      openAmount: '11.90',
    });
    expect(row(rows, '2026-10')).toMatchObject({
      bills: 0,
      receivedAmount: '11.90',
    });
  });

  it('leaves out voided bills', () => {
    const rows = summarizeByMonth([bill({ status: 'VOID' })], MONTHS, 'UTC');

    expect(rows).toEqual([]);
  });

  it('keeps currencies apart', () => {
    const rows = summarizeByMonth(
      [bill({}), bill({ currency: 'CZK' })],
      MONTHS,
      'UTC',
    );

    expect(
      rows
        .filter((entry) => entry.month === '2026-09')
        .map((entry) => [entry.currency, entry.bills]),
    ).toEqual([
      ['CZK', 1],
      ['EUR', 1],
    ]);
  });

  it('reads months in the given time zone', () => {
    const lateInSeptember = bill({
      finalizedAt: new Date('2026-09-30T22:30:00Z'),
    });

    expect(
      row(
        summarizeByMonth([lateInSeptember], MONTHS, 'Europe/Berlin'),
        '2026-10',
      )?.bills,
    ).toBe(1);
  });

  it('ignores bills outside the months', () => {
    const rows = summarizeByMonth(
      [bill({ finalizedAt: new Date('2026-01-10T10:00:00Z') })],
      MONTHS,
      'UTC',
    );

    expect(rows.every((entry) => entry.bills === 0)).toBe(true);
  });
});

describe('yearMonths', () => {
  it('runs up to the current month in the current year', () => {
    expect(yearMonths(2026, '2026-03', '2025-06')).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
  });

  it('covers a past year in full', () => {
    expect(yearMonths(2025, '2026-03', '2024-01')).toHaveLength(12);
  });

  it('starts at the first billed month', () => {
    expect(yearMonths(2025, '2026-03', '2025-10')).toEqual([
      '2025-10',
      '2025-11',
      '2025-12',
    ]);
  });

  it('is empty before billing started, or without any bill', () => {
    expect(yearMonths(2024, '2026-03', '2025-10')).toEqual([]);
    expect(yearMonths(2026, '2026-03', null)).toEqual([]);
  });
});

describe('billingYears', () => {
  it('lists every year since the first bill, newest first', () => {
    expect(billingYears('2024-11', '2026-02')).toEqual([2026, 2025, 2024]);
    expect(billingYears(null, '2026-02')).toEqual([]);
  });
});

describe('summarizeTotals', () => {
  it('adds the months up per currency', () => {
    const rows = summarizeByMonth(
      [
        bill({}),
        bill({ finalizedAt: new Date('2026-08-10T10:00:00Z') }),
        bill({ currency: 'CZK' }),
      ],
      MONTHS,
      'UTC',
    );

    expect(summarizeTotals(rows)).toEqual([
      expect.objectContaining({ currency: 'CZK', bills: 1 }),
      expect.objectContaining({
        currency: 'EUR',
        bills: 2,
        grossAmount: '23.80',
        openAmount: '23.80',
      }),
    ]);
  });
});
