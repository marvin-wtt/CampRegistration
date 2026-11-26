import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Expense } from '@camp-registration/common/entities';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import type { ResponsiveMenuItem } from '@/types/menu';
import ExpenseCaptureDialog from '@/components/event/finances/dialogs/ExpenseCaptureDialog.vue';
import ExpensePaidDialog from '@/components/event/finances/dialogs/ExpensePaidDialog.vue';
import { isUnpaid } from '@/utils/expenseState';
import { usePermissions } from '@/composables/permissions';
import { useExpenseDeleteMessage } from '@/composables/payoutStatements';
import { useFinanceStore } from '@/stores/finance-store';

/** What the viewer may do with a receipt; absent where they may not. */
export interface ExpenseActions {
  /** Only on an invoice still to pay. */
  markPaid?: ResponsiveMenuItem | undefined;
  edit?: ResponsiveMenuItem | undefined;
  remove?: ResponsiveMenuItem | undefined;
}

/** Changing a receipt: the edit form, or deleting it after a confirmation. */
export function useExpenseActions() {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const { canOn } = usePermissions();
  const financeStore = useFinanceStore();
  const deleteMessage = useExpenseDeleteMessage();

  function edit(expense: Expense) {
    quasar.dialog({
      component: ExpenseCaptureDialog,
      componentProps: { expense },
    });
  }

  function markPaid(expense: Expense) {
    quasar.dialog({
      component: ExpensePaidDialog,
      componentProps: { expense },
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
        financeStore.deleteExpense(expense.id).catch(() => undefined);
      });
  }

  function actionsFor(expense: Expense): ExpenseActions {
    const editable = canOn('event.expenses.edit', expense);
    return {
      markPaid:
        editable && isUnpaid(expense)
          ? {
              label:
                expense.type === 'REFUND'
                  ? t('finance.action.markReceived')
                  : t('finance.action.markPaid'),
              icon: 'price_check',
              onClick: () => markPaid(expense),
            }
          : undefined,
      edit: editable
        ? {
            label: t('finance.expenseDetails.edit'),
            icon: 'edit',
            onClick: () => edit(expense),
          }
        : undefined,
      remove: canOn('event.expenses.delete', expense)
        ? {
            label: t('finance.action.delete'),
            icon: 'delete',
            color: 'negative',
            onClick: () => remove(expense),
          }
        : undefined,
    };
  }

  return { actionsFor };
}
