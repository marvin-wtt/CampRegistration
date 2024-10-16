import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import type {
  Expense,
  ExpenseCreateData,
  ExpenseUpdateData,
} from '@camp-registration/common/entities';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus, useCampBus } from 'src/composables/bus';

export const useExpensesStore = defineStore('expenses', () => {
  const route = useRoute();
  const apiService = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withErrorNotification,
    lazyFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<Expense[]>('expense');

  // TODO add i18n

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  async function fetchData(campId?: string) {
    const cid: string = campId ?? (route.params.camp as string);
    checkNotNullWithError(cid);

    await lazyFetch(async () => {
      return await apiService.fetchExpenses(cid);
    });
  }

  async function storeData(campId: string, createData: ExpenseCreateData) {
    checkNotNullWithError(campId);

    const expense = await apiService.createExpense(campId, createData);

    data.value?.push(expense);

    return expense;
  }

  async function updateData(
    expenseId: string | undefined,
    updateData: ExpenseUpdateData,
  ) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const eid = checkNotNullWithNotification(expenseId);

    return withErrorNotification('update', async () => {
      const expense = await apiService.updateExpense(cid, eid, updateData);

      // Replace the registration with a new one
      data.value = data.value?.map((value) =>
        value.id === expenseId ? expense : value,
      );
    });
  }

  async function deleteData(expenseId?: string) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const eid = checkNotNullWithNotification(expenseId);

    await withErrorNotification('delete', async () => {
      await apiService.deleteExpense(cid, eid);

      // Replace the registration with a new one
      data.value = data.value?.filter((expense) => expense.id !== expenseId);
    });
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    storeData,
    updateData,
    deleteData,
  };
});
