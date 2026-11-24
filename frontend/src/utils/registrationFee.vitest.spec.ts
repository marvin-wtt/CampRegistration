import { describe, expect, it } from 'vitest';
import type {
  PaymentBalance,
  RegistrationFee,
} from '@camp-registration/common/entities';
import {
  feeTotals,
  feeTotalsByCurrency,
  feeTotalsByGroup,
  matchesFeeFilter,
  matchesFeeSearch,
  sortFees,
} from '@/utils/registrationFee';

function fee(
  balance: Partial<PaymentBalance> = {},
  data: Partial<RegistrationFee> = {},
): RegistrationFee {
  return {
    id: 'r1',
    reference: 'K7MX-0042',
    firstName: 'Anna',
    lastName: 'Schmidt',
    email: null,
    status: 'ACCEPTED',
    group: 'de',
    createdAt: '2026-05-01T00:00:00.000Z',
    amountDue: {
      quotedAmount: 20000,
      override: null,
      note: null,
      adjustedAt: null,
      reductions: 0,
    },
    balance: {
      status: 'UNPAID',
      currency: 'EUR',
      amountDue: 20000,
      amountPaid: 0,
      outstanding: 20000,
      overpaid: 0,
      ...balance,
    },
    payments: [],
    ...data,
  };
}

describe('matchesFeeSearch', () => {
  it('finds a reference however it was typed', () => {
    expect(matchesFeeSearch(fee(), 'k7mx42')).toBe(true);
    expect(matchesFeeSearch(fee(), 'K7MX-0043')).toBe(false);
  });

  it('searches names otherwise', () => {
    expect(matchesFeeSearch(fee(), 'schm')).toBe(true);
    expect(matchesFeeSearch(fee(), 'Peter')).toBe(false);
  });
});

describe('matchesFeeFilter', () => {
  it('counts only accepted registrations as owing', () => {
    expect(matchesFeeFilter(fee(), 'owing')).toBe(true);
    expect(matchesFeeFilter(fee({}, { status: 'WAITLISTED' }), 'owing')).toBe(
      false,
    );
  });

  it('leaves out pending registrations without payments from all', () => {
    expect(matchesFeeFilter(fee({}, { status: 'PENDING' }), 'all')).toBe(false);
  });
});

describe('feeTotals', () => {
  it('expects only accepted fees but counts every payment', () => {
    const totals = feeTotals([
      fee({ amountPaid: 5000, outstanding: 15000, status: 'PARTIAL' }),
      fee(
        { amountPaid: 3000, outstanding: 17000 },
        { id: 'r2', status: 'WAITLISTED' },
      ),
    ]);

    expect(totals).toEqual({
      expected: 20000,
      received: 8000,
      outstanding: 15000,
      overpaid: 0,
    });
  });
});

describe('feeTotalsByGroup', () => {
  it('keeps groups and currencies apart, in the event order', () => {
    const totals = feeTotalsByGroup(
      [
        fee({ amountPaid: 20000, outstanding: 0, status: 'PAID' }),
        fee(
          {
            currency: 'PLN',
            amountDue: 80000,
            amountPaid: 30000,
            outstanding: 50000,
          },
          { id: 'r2', group: 'pl' },
        ),
        fee({ amountPaid: 5000, outstanding: 15000 }, { id: 'r3' }),
        fee({}, { id: 'r4', group: null }),
      ],
      ['pl', 'de'],
    );

    expect(
      totals.map(({ group, currency, received, outstanding, count }) => ({
        group,
        currency,
        received,
        outstanding,
        count,
      })),
    ).toEqual([
      {
        group: 'pl',
        currency: 'PLN',
        received: 30000,
        outstanding: 50000,
        count: 1,
      },
      {
        group: 'de',
        currency: 'EUR',
        received: 25000,
        outstanding: 15000,
        count: 2,
      },
      {
        group: null,
        currency: 'EUR',
        received: 0,
        outstanding: 20000,
        count: 1,
      },
    ]);
  });
});

describe('feeTotalsByCurrency', () => {
  it('never adds up different currencies, the event currency first', () => {
    const totals = feeTotalsByCurrency(
      [
        fee({ currency: 'PLN', amountPaid: 30000, outstanding: 0 }),
        fee({ amountPaid: 5000, outstanding: 15000 }, { id: 'r2' }),
      ],
      'EUR',
    );

    expect(totals.map((t) => [t.currency, t.received])).toEqual([
      ['EUR', 5000],
      ['PLN', 30000],
    ]);
  });
});

describe('sortFees', () => {
  const fees = [
    fee(
      { outstanding: 0 },
      {
        id: 'a',
        lastName: 'Weber',
        reference: 'K7MX-0003',
        createdAt: '2026-05-03T00:00:00.000Z',
      },
    ),
    fee(
      { outstanding: 15000 },
      {
        id: 'b',
        lastName: 'Adler',
        reference: 'K7MX-0002',
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    ),
    fee(
      { outstanding: 15000 },
      {
        id: 'c',
        lastName: 'Meyer',
        reference: 'K7MX-0001',
        createdAt: '2026-05-02T00:00:00.000Z',
      },
    ),
  ];
  const ids = (sort: Parameters<typeof sortFees>[1]) =>
    sortFees(fees, sort).map((f) => f.id);

  it('sorts by last name by default', () => {
    expect(ids('name')).toEqual(['b', 'c', 'a']);
  });

  it('sorts by reference, newest and most open, ties by name', () => {
    expect(ids('reference')).toEqual(['c', 'b', 'a']);
    expect(ids('newest')).toEqual(['a', 'c', 'b']);
    expect(ids('outstanding')).toEqual(['b', 'c', 'a']);
  });
});
