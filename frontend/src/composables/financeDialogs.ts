import { useQuasar } from 'quasar';
import type {
  Expense,
  FinanceCategoryKind,
  Income,
  Payout,
} from '@camp-registration/common/entities';
import ExpenseCaptureDialog, {
  type ExpensePrefill,
} from '@/components/event/finances/dialogs/ExpenseCaptureDialog.vue';
import ExpenseDetailsDialog from '@/components/event/finances/dialogs/ExpenseDetailsDialog.vue';
import PayoutDetailsDialog from '@/components/event/finances/dialogs/PayoutDetailsDialog.vue';
import FinanceCategoryDialog from '@/components/event/finances/dialogs/FinanceCategoryDialog.vue';
import FinanceSettingsDialog from '@/components/event/finances/dialogs/FinanceSettingsDialog.vue';
import IncomeDetailsDialog from '@/components/event/finances/dialogs/IncomeDetailsDialog.vue';
import IncomeDialog, {
  type IncomePrefill,
} from '@/components/event/finances/dialogs/IncomeDialog.vue';

/**
 * The finance tabs' entry dialogs. The details dialogs stay open through
 * their actions (`expenseActions`, `payoutActions`), which open on top.
 */
export function useFinanceDialogs() {
  const quasar = useQuasar();

  // No arguments: it is bound straight to click handlers, which would pass
  // their event along. A prefilled capture is `captureFrom`.
  function capture() {
    quasar.dialog({ component: ExpenseCaptureDialog });
  }

  function captureFrom(prefill: ExpensePrefill) {
    quasar.dialog({
      component: ExpenseCaptureDialog,
      componentProps: { prefill },
    });
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

  function categories(kind: FinanceCategoryKind = 'EXPENSE') {
    quasar.dialog({
      component: FinanceCategoryDialog,
      componentProps: { kind },
    });
  }

  function income() {
    quasar.dialog({ component: IncomeDialog });
  }

  function incomeDetails(income: Income) {
    quasar.dialog({
      component: IncomeDetailsDialog,
      componentProps: { income },
    });
  }

  function incomeFrom(prefill: IncomePrefill) {
    quasar.dialog({ component: IncomeDialog, componentProps: { prefill } });
  }

  function settings() {
    quasar.dialog({ component: FinanceSettingsDialog });
  }

  return {
    capture,
    captureFrom,
    expenseDetails,
    payoutDetails,
    categories,
    income,
    incomeFrom,
    incomeDetails,
    settings,
  };
}
