import { useQuasar } from 'quasar';
import type { Expense, Payout } from '@camp-registration/common/entities';
import ExpenseCaptureDialog from '@/components/event/finances/dialogs/ExpenseCaptureDialog.vue';
import ExpenseDetailsDialog from '@/components/event/finances/dialogs/ExpenseDetailsDialog.vue';
import PayoutDetailsDialog from '@/components/event/finances/dialogs/PayoutDetailsDialog.vue';
import FinanceCategoryDialog from '@/components/event/finances/dialogs/FinanceCategoryDialog.vue';
import FinanceSettingsDialog from '@/components/event/finances/dialogs/FinanceSettingsDialog.vue';
import IncomeDialog from '@/components/event/finances/dialogs/IncomeDialog.vue';

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

  function incomeCategories() {
    quasar.dialog({
      component: FinanceCategoryDialog,
      componentProps: { kind: 'INCOME' },
    });
  }

  function income() {
    quasar.dialog({ component: IncomeDialog });
  }

  function settings() {
    quasar.dialog({ component: FinanceSettingsDialog });
  }

  return {
    capture,
    expenseDetails,
    payoutDetails,
    categories,
    incomeCategories,
    income,
    settings,
  };
}
