import type {
  PaymentBalance,
  RegistrationFee,
} from '@camp-registration/common/entities';
import { parsePaymentReference } from '@camp-registration/common/utils';
import { formatPersonName } from '@/utils/formatters/personName';

export const FEE_FILTERS = ['owing', 'overpaid', 'paid', 'all'] as const;
export type FeeFilter = (typeof FEE_FILTERS)[number];

export const FEE_SORTS = [
  'name',
  'reference',
  'newest',
  'outstanding',
] as const;
export type FeeSort = (typeof FEE_SORTS)[number];

export function feeName(fee: Pick<RegistrationFee, 'firstName' | 'lastName'>) {
  return formatPersonName(
    [fee.firstName, fee.lastName].filter(Boolean).join(' '),
  );
}

/** Still to pay: only accepted registrations owe. */
export function isOwing(fee: RegistrationFee): boolean {
  return fee.status === 'ACCEPTED' && fee.balance.outstanding > 0;
}

/**
 * Whether a fee belongs in a filter. `all` leaves out what isn't anyone's
 * business yet: not accepted, nothing paid.
 */
export function matchesFeeFilter(
  fee: RegistrationFee,
  filter: FeeFilter,
): boolean {
  switch (filter) {
    case 'owing':
      return isOwing(fee);
    case 'overpaid':
      return fee.balance.overpaid > 0;
    case 'paid':
      return fee.balance.status === 'PAID';
    case 'all':
      return fee.status === 'ACCEPTED' || fee.payments.length > 0;
  }
}

/**
 * A reference matches as typed or copied from a statement (case, dash and
 * spaces don't matter); anything else searches the name.
 */
export function matchesFeeSearch(fee: RegistrationFee, query: string): boolean {
  const text = query.trim();
  if (!text) {
    return true;
  }
  const reference = parsePaymentReference(text);
  if (reference) {
    const own = parsePaymentReference(fee.reference);
    return own?.code === reference.code && own.number === reference.number;
  }
  const name = [fee.firstName, fee.lastName].join(' ').toLowerCase();
  return (
    name.includes(text.toLowerCase()) ||
    fee.reference.toLowerCase().includes(text.toLowerCase())
  );
}

/**
 * What the fees view leads with; owed amounts count accepted only. Only for
 * fees in one currency — see `feeTotalsByCurrency`.
 */
export function feeTotals(fees: RegistrationFee[]) {
  const accepted = fees.filter((fee) => fee.status === 'ACCEPTED');
  const sum = (list: RegistrationFee[], pick: (b: PaymentBalance) => number) =>
    list.reduce((total, fee) => total + pick(fee.balance), 0);

  return {
    expected: sum(accepted, (b) => b.amountDue ?? 0),
    received: sum(fees, (b) => b.amountPaid),
    outstanding: sum(accepted, (b) => b.outstanding),
    overpaid: sum(fees, (b) => b.overpaid),
  };
}

export type FeeTotals = ReturnType<typeof feeTotals>;

export interface FeeGroupTotals extends FeeTotals {
  group: string | null;
  currency: string;
  count: number;
}

/** In this group, or in any with `null`. */
export function matchesFeeGroup(
  fee: RegistrationFee,
  group: string | null,
): boolean {
  return group === null || fee.group === group;
}

/**
 * Totals per group and currency: amounts in different currencies never add
 * up. In the order of the event's groups, fees without a group last.
 */
export function feeTotalsByGroup(
  fees: RegistrationFee[],
  groups: readonly string[],
): FeeGroupTotals[] {
  const byKey = new Map<string, RegistrationFee[]>();
  for (const fee of fees) {
    const key = `${fee.group ?? ''}|${fee.balance.currency}`;
    byKey.set(key, [...(byKey.get(key) ?? []), fee]);
  }
  const rank = (group: string | null) => {
    const index = group === null ? -1 : groups.indexOf(group);
    return index === -1 ? groups.length : index;
  };

  return [...byKey.values()]
    .map((list) => ({
      group: list[0]?.group ?? null,
      currency: list[0]?.balance.currency ?? '',
      count: list.length,
      ...feeTotals(list),
    }))
    .sort(
      (a, b) =>
        rank(a.group) - rank(b.group) || a.currency.localeCompare(b.currency),
    );
}

/** Totals per currency, the event's own first. */
export function feeTotalsByCurrency(
  fees: RegistrationFee[],
  eventCurrency: string,
): (FeeTotals & { currency: string })[] {
  const byCurrency = new Map<string, RegistrationFee[]>();
  for (const fee of fees) {
    const currency = fee.balance.currency;
    byCurrency.set(currency, [...(byCurrency.get(currency) ?? []), fee]);
  }

  return [...byCurrency.entries()]
    .map(([currency, list]) => ({ currency, ...feeTotals(list) }))
    .sort(
      (a, b) =>
        Number(b.currency === eventCurrency) -
          Number(a.currency === eventCurrency) ||
        a.currency.localeCompare(b.currency),
    );
}

const byName = (a: RegistrationFee, b: RegistrationFee) =>
  (a.lastName ?? '').localeCompare(b.lastName ?? '') ||
  (a.firstName ?? '').localeCompare(b.firstName ?? '');

/**
 * The fees in the chosen order; ties fall back to the name, so the list
 * never shuffles between two equal amounts.
 */
export function sortFees(
  fees: readonly RegistrationFee[],
  sort: FeeSort,
): RegistrationFee[] {
  const compare: Record<
    FeeSort,
    (a: RegistrationFee, b: RegistrationFee) => number
  > = {
    name: byName,
    reference: (a, b) => a.reference.localeCompare(b.reference),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b),
    outstanding: (a, b) =>
      b.balance.outstanding - a.balance.outstanding || byName(a, b),
  };

  return [...fees].sort(compare[sort]);
}
