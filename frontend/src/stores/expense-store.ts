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
import { computed } from 'vue';

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
    withProgressNotification,
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

  async function fetchData() {
    const campId: string = route.params.camp as string;
    checkNotNullWithError(campId);

    await lazyFetch(async () => {
      return await apiService.fetchExpenses(campId);
    });
  }

  async function storeData(createData: ExpenseCreateData) {
    const campId = route.params.camp as string;
    checkNotNullWithError(campId);

    return withProgressNotification('create', async () => {
      const expense = await apiService.createExpense(campId, createData);

      data.value?.push(expense);

      return expense;
    });
  }

  async function updateData(expenseId: string, updateData: ExpenseUpdateData) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const eid = checkNotNullWithNotification(expenseId);

    return withProgressNotification('update', async () => {
      const expense = await apiService.updateExpense(cid, eid, updateData);

      // Replace the registration with a new one
      data.value = data.value?.map((value) =>
        value.id === expenseId ? expense : value,
      );
    });
  }

  async function deleteData(expenseId: string) {
    const campId = route.params.camp as string;

    const cid = checkNotNullWithError(campId);
    const eid = checkNotNullWithNotification(expenseId);

    await withProgressNotification('delete', async () => {
      await apiService.deleteExpense(cid, eid);

      // Replace the registration with a new one
      data.value = data.value?.filter((expense) => expense.id !== expenseId);
    });
  }

  const people = computed<string[]>(() => {
    if (!data.value) {
      return [];
    }

    const names = data.value
      .map((value) => value.paidBy)
      .filter((value) => value != null);

    const uniqueNames = [...new Set(names)];

    return uniqueNames.sort((a, b) => a.localeCompare(b));
  });

  const categories = computed<string[]>(() => {
    if (!data.value) {
      return [];
    }

    const categories = data.value
      .map((value) => value.category)
      .filter((value) => value != null);

    const uniqueCategories = [...new Set(categories)];

    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  });

  return {
    reset,
    data,
    people,
    categories,
    isLoading,
    error,
    fetchData,
    storeData,
    updateData,
    deleteData,
  };
});
