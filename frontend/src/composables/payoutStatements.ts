import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Expense, Payout } from '@camp-registration/common/entities';
import { payerKey, recipientKey } from '@camp-registration/common/utils';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import { useFinanceStore } from '@/stores/finance-store';

/**
 * The payout statements that list this receipt, as `P3, P5`: by default the
 * current ones, which an edit would make outdated.
 */
export function statementLabels(
  expenseId: string,
  payouts: readonly Payout[] | undefined,
  { includeOutdated = false }: { includeOutdated?: boolean } = {},
): string {
  return (payouts ?? [])
    .filter(
      (p) =>
        (includeOutdated || !p.outdated) &&
        p.statementExpenseIds.includes(expenseId),
    )
    .map((p) => p.label)
    .join(', ');
}

/**
 * The current statements an edit would make outdated: those listing the
 * receipt, and on a new payer, theirs it now falls under.
 */
export function affectedStatementLabels(
  before: Expense,
  after: Pick<Expense, 'type' | 'amount' | 'paidByUserId' | 'paidByName'>,
  payouts: readonly Payout[] | undefined,
): string {
  const newPayer = payerKey(after);
  const samePayer = payerKey(before) === newPayer;
  if (
    samePayer &&
    before.type === after.type &&
    before.amount === after.amount
  ) {
    return '';
  }

  return (payouts ?? [])
    .filter(
      (p) =>
        !p.outdated &&
        (p.statementExpenseIds.includes(before.id) ||
          (!samePayer &&
            recipientKey(p) === newPayer &&
            before.receiptNumber <= p.statementReceiptsUpTo)),
    )
    .map((p) => p.label)
    .join(', ');
}

/** Asks before an edit makes statements outdated; resolves whether to go on. */
export function useConfirmStatementChange() {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const financeStore = useFinanceStore();

  return (
    before: Expense,
    after: Pick<Expense, 'type' | 'amount' | 'paidByUserId' | 'paidByName'>,
  ): Promise<boolean> => {
    const labels = affectedStatementLabels(before, after, financeStore.payouts);
    if (!labels) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      quasar
        .dialog({
          component: ConfirmDialog,
          componentProps: {
            title: t('finance.capture.onStatement.title', {
              number: before.receiptNumber,
            }),
            message: t('finance.capture.onStatement.message', { labels }),
            okLabel: t('finance.capture.onStatement.ok'),
          },
        })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });
  };
}

/** The delete confirmation, naming the statements it would make outdated. */
export function useExpenseDeleteMessage() {
  const { t } = useI18n({ useScope: 'global' });
  const financeStore = useFinanceStore();

  return (expense: Expense): string => {
    const labels = statementLabels(expense.id, financeStore.payouts);
    return labels
      ? `${t('finance.delete.message')} ${t('finance.delete.onStatement', { labels })}`
      : t('finance.delete.message');
  };
}

/**
 * Deleting a payout that was paid undoes a record of real money: only for a
 * recording error, and with the slip printed first.
 */
export function useConfirmRemovePayout() {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });

  return (payout: Payout, onConfirm: () => void) => {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('finance.payout.delete.title', { label: payout.label }),
          message: payout.paidOn
            ? t('finance.payout.delete.messagePaid')
            : t('finance.payout.delete.message'),
          okLabel: t('finance.payout.delete.ok'),
          color: 'negative',
        },
      })
      .onOk(onConfirm);
  };
}
