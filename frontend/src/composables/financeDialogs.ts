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
import PayoutDialog from '@/components/event/finances/dialogs/PayoutDialog.vue';
import ExpenseCategoryDialog from '@/components/event/finances/dialogs/ExpenseCategoryDialog.vue';
import FinanceSettingsDialog from '@/components/event/finances/dialogs/FinanceSettingsDialog.vue';
import PayoutSignDialog from '@/components/event/finances/dialogs/PayoutSignDialog.vue';
import { useFinanceStore } from '@/stores/finance-store';

export function useFinanceDialogs() {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const financeStore = useFinanceStore();

  function capture() {
    quasar.dialog({ component: ExpenseCaptureDialog });
  }

  function edit(expense: Expense, canDelete = false) {
    quasar.dialog({
      component: ExpenseCaptureDialog,
      componentProps: { expense, canDelete },
    });
  }

  function remove(expense: Expense) {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('finance.delete.title', { number: expense.receiptNumber }),
          message: t('finance.delete.message'),
          okLabel: t('finance.delete.ok'),
          color: 'negative',
        },
      })
      .onOk(() => {
        void financeStore.deleteExpense(expense.id);
      });
  }

  /** "Settle" prefills the open balance; the amount stays editable. */
  function payout(balance: FinanceBalance, direction: PayoutDirection) {
    quasar.dialog({
      component: PayoutDialog,
      componentProps: { balance, direction },
    });
  }

  function editPayout(existing: Payout) {
    quasar.dialog({
      component: PayoutDialog,
      componentProps: { payout: existing },
    });
  }

  function removePayout(existing: Payout) {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('finance.payout.delete.title', { label: existing.label }),
          message: t('finance.payout.delete.message'),
          okLabel: t('finance.payout.delete.ok'),
          color: 'negative',
        },
      })
      .onOk(() => {
        void financeStore.deletePayout(existing.id);
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
