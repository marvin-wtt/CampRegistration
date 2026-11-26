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

type StatementFields =
  'type' | 'amount' | 'paidOn' | 'paidByUserId' | 'paidByName';

/**
 * The current statements an edit would make outdated: those listing the
 * receipt, and those of the payer it now falls under: a new payer, or one
 * whose invoice is now paid. Unpaid invoices are on no statement.
 */
function affectedStatementLabels(
  before: Expense,
  after: Pick<Expense, StatementFields>,
  payouts: readonly Payout[] | undefined,
): string {
  const newPayer = payerKey(after);
  const samePayer = payerKey(before) === newPayer;
  const samePaid = (before.paidOn === null) === (after.paidOn === null);
  if (
    samePayer &&
    samePaid &&
    before.type === after.type &&
    before.amount === after.amount
  ) {
    return '';
  }
  const joins = after.paidOn !== null && (!samePayer || !samePaid);

  return (payouts ?? [])
    .filter(
      (p) =>
        !p.outdated &&
        (p.statementExpenseIds.includes(before.id) ||
          (joins &&
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
    after: Pick<Expense, StatementFields>,
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
