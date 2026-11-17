import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  Expense,
  FinanceBalance,
  Payout,
  PayoutDirection,
} from '@camp-registration/common/entities';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import ExpenseCaptureDialog from '@/components/event/finances/dialogs/ExpenseCaptureDialog.vue';
import ExpenseDetailsDialog from '@/components/event/finances/dialogs/ExpenseDetailsDialog.vue';
import PayoutDialog from '@/components/event/finances/dialogs/PayoutDialog.vue';
import ExpenseCategoryDialog from '@/components/event/finances/dialogs/ExpenseCategoryDialog.vue';
import FinanceSettingsDialog from '@/components/event/finances/dialogs/FinanceSettingsDialog.vue';
import PayoutSignDialog from '@/components/event/finances/dialogs/PayoutSignDialog.vue';
import { useFinanceStore } from '@/stores/finance-store';
import {
  useConfirmRemovePayout,
  useExpenseDeleteMessage,
} from '@/composables/payoutStatements';

export function useFinanceDialogs() {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const financeStore = useFinanceStore();
  const deleteMessage = useExpenseDeleteMessage();

  function capture() {
    quasar.dialog({ component: ExpenseCaptureDialog });
  }

  function edit(expense: Expense) {
    quasar.dialog({
      component: ExpenseCaptureDialog,
      componentProps: { expense },
    });
  }

  /** Tapping a receipt shows it; editing and deleting continue from there. */
  function details(expense: Expense, canEdit = false, canDelete = false) {
    quasar
      .dialog({
        component: ExpenseDetailsDialog,
        componentProps: { expense, canEdit, canDelete },
      })
      .onOk((action: 'edit' | 'delete') => {
        if (action === 'edit') {
          edit(expense);
        } else {
          remove(expense);
        }
      });
  }

  function remove(expense: Expense) {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('finance.delete.title', { number: expense.receiptNumber }),
          message: deleteMessage(expense),
          okLabel: t('finance.delete.ok'),
          color: 'negative',
        },
      })
      .onOk(() => {
        void financeStore.deleteExpense(expense.id);
      });
  }

  /** "Settle" prefills the open balance; the amount stays editable. */
  function payout(
    balance: FinanceBalance,
    direction: PayoutDirection,
    onCreated?: (created: Payout) => void,
  ) {
    quasar
      .dialog({
        component: PayoutDialog,
        componentProps: { balance, direction },
      })
      .onOk((created: Payout) => onCreated?.(created));
  }

  function editPayout(existing: Payout) {
    quasar.dialog({
      component: PayoutDialog,
      componentProps: { payout: existing },
    });
  }

  const confirmRemovePayout = useConfirmRemovePayout();

  function removePayout(existing: Payout) {
    confirmRemovePayout(existing, () => {
      financeStore.deletePayout(existing.id).catch(() => undefined);
    });
  }

  /** The recipient reads the statement and signs it. */
  function signPayout(existing: Payout) {
    quasar.dialog({
      component: PayoutSignDialog,
      componentProps: { payout: existing },
    });
  }

  function unsignPayout(existing: Payout) {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('finance.statement.unsign.title', { label: existing.label }),
          message: t('finance.statement.unsign.message'),
          okLabel: t('finance.statement.unsign.ok'),
          color: 'negative',
        },
      })
      .onOk(() => {
        financeStore.unsignPayout(existing.id).catch(() => undefined);
      });
  }

  function categories() {
    quasar.dialog({ component: ExpenseCategoryDialog });
  }

  function settings() {
    quasar.dialog({ component: FinanceSettingsDialog });
  }

  return {
    capture,
    details,
    edit,
    remove,
    payout,
    editPayout,
    removePayout,
    signPayout,
    unsignPayout,
    categories,
    settings,
  };
}
