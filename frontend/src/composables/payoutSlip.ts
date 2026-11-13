import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Payout } from '@camp-registration/common/entities';
import { useFinanceStore } from '@/stores/finance-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { buildPayoutStatement } from '@/utils/payoutStatement';
import { parseLocalDate } from '@/utils/date';
import { printPayoutSlip } from '@/components/event/finances/printPayoutSlip';

/**
 * What the recipient confirms, in their own words — the same text on the
 * signing sheet and on the printed slip.
 */
export function usePayoutDeclaration() {
  const { t } = useI18n({ useScope: 'global' });
  const { to } = useObjectTranslation();
  const { money } = useFinanceFormat();
  const { data: event } = storeToRefs(useEventDetailsStore());

  return (payout: Payout): string =>
    t(
      payout.direction === 'OUT'
        ? 'finance.statement.declarationOut'
        : 'finance.statement.declarationIn',
      { event: to(event.value?.name), amount: money(payout.amount) },
    );
}

/** Prints a payout's statement: its receipts, the balance and the signature. */
export function usePayoutSlip() {
  const quasar = useQuasar();
  const { t, d } = useI18n({ useScope: 'global' });
  const { money, signedMoney } = useFinanceFormat();
  const declaration = usePayoutDeclaration();
  const { expenses, payouts } = storeToRefs(useFinanceStore());
  const { data: event } = storeToRefs(useEventDetailsStore());

  const date = (value: string | null) =>
    value ? d(parseLocalDate(value), 'date') : t('finance.receiptPending');
  const moved = (payout: Payout) =>
    `${payout.direction === 'OUT' ? '−' : '+'}${money(payout.amount)}`;

  return (payout: Payout) => {
    if (!event.value) {
      return;
    }
    const statement = buildPayoutStatement(
      payout,
      expenses.value ?? [],
      payouts.value ?? [],
    );

    printPayoutSlip(
      {
        eventName: event.value.name,
        organizer: event.value.organizer,
        label: payout.label,
        direction: payout.direction,
        paidOn: payout.paidOn ? d(parseLocalDate(payout.paidOn), 'date') : null,
        createdByName: payout.createdByName,
        createdOn: d(new Date(payout.createdAt), 'date'),
        recipientName: payout.recipientName,
        note: payout.note,
        expenses: statement.expenses.map((expense) => ({
          number: `#${expense.receiptNumber.toString()}`,
          date: date(expense.date),
          description: expense.description,
          amount: signedMoney(expense),
        })),
        totals: [
          { label: t('finance.balance.paid'), amount: money(statement.paid) },
          ...(statement.refunds > 0
            ? [
                {
                  label: t('finance.balance.refunds'),
                  amount: `−${money(statement.refunds)}`,
                },
              ]
            : []),
          ...statement.earlier.map((earlier) => ({
            label: `${earlier.label} · ${
              earlier.paidOn ? date(earlier.paidOn) : t('finance.payout.toPay')
            }`,
            amount: moved(earlier),
          })),
          {
            label: t('finance.statement.open'),
            amount: money(statement.before),
            strong: true,
          },
          {
            label: `${payout.label} · ${
              payout.direction === 'OUT'
                ? t('finance.payout.out')
                : t('finance.payout.in')
            }`,
            amount: moved(payout),
            strong: true,
          },
          {
            label: t('finance.payout.balanceAfter'),
            amount: money(statement.after),
          },
        ],
        declaration: declaration(payout),
        signature: payout.signature,
        signedAt: payout.signedAt
          ? d(new Date(payout.signedAt), 'dateTime')
          : null,
      },
      (message) => quasar.notify({ type: 'negative', message }),
    );
  };
}
