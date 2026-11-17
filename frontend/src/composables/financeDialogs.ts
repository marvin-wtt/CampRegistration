import { useQuasar } from 'quasar';
import type { Expense, Payout } from '@camp-registration/common/entities';
import ExpenseCaptureDialog from '@/components/event/finances/dialogs/ExpenseCaptureDialog.vue';
import ExpenseDetailsDialog from '@/components/event/finances/dialogs/ExpenseDetailsDialog.vue';
import PayoutDetailsDialog from '@/components/event/finances/dialogs/PayoutDetailsDialog.vue';
import FinanceCategoryDialog from '@/components/event/finances/dialogs/FinanceCategoryDialog.vue';
import FinanceSettingsDialog from '@/components/event/finances/dialogs/FinanceSettingsDialog.vue';

/**
 * The finance tabs' entry dialogs. The details dialogs stay open through
 * their actions (`expenseActions`, `payoutActions`), which open on top.
 */
export function useFinanceDialogs() {
  const quasar = useQuasar();

  function capture() {
    quasar.dialog({ component: ExpenseCaptureDialog });
  }

  function expenseDetails(expense: Expense) {
    quasar.dialog({
      component: ExpenseDetailsDialog,
      componentProps: { expense },
    });
  }

  function payoutDetails(payout: Payout) {
    quasar.dialog({
      component: PayoutDetailsDialog,
      componentProps: { payout },
    });
  }

  function categories() {
    quasar.dialog({ component: FinanceCategoryDialog });
  }

  function settings() {
    quasar.dialog({ component: FinanceSettingsDialog });
  }

  return { capture, expenseDetails, payoutDetails, categories, settings };
}
