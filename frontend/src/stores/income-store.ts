import { defineStore } from 'pinia';
import { watch } from 'vue';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import { useFinanceStore } from '@/stores/finance-store';
import type {
  Income,
  IncomeCreateData,
  IncomeUpdateData,
} from '@camp-registration/common/entities';

/**
 * Money the event receives other than registration fees — grants, donations
 * (docs/finances.md, "Income"). Live like the expenses.
 */
export const useIncomeStore = defineStore('income', () => {
  const api = useAPIService();
  const key = useRouteKey('eventId');
  const financeStore = useFinanceStore();

  const incomes = useCollection<Income>({
    name: 'income',
    key,
    fetch: (eventId) => api.fetchIncomes(eventId),
    realtime: {
      resource: 'income',
      fetchOne: (eventId, id) => api.fetchIncome(eventId, id),
    },
  });

  // The summary and the category counts are derived from it.
  watch(incomes.data, (_next, prev) => {
    if (prev !== undefined) {
      financeStore.reloadIncomeDerived();
    }
  });

  function fetchData() {
    return Promise.all([incomes.load(), financeStore.loadIncomeCategories()]);
  }

  function createIncome(data: IncomeCreateData): Promise<Income> {
    return incomes.mutate(
      'create',
      (eventId) => api.createIncome(eventId, data),
      { apply: upsertById, feedback: 'result' },
    );
  }

  function updateIncome(
    incomeId: string,
    data: IncomeUpdateData,
  ): Promise<Income> {
    return incomes.mutate(
      'update',
      (eventId) => api.updateIncome(eventId, incomeId, data),
      { apply: replaceById },
    );
  }

  async function deleteIncome(incomeId: string): Promise<void> {
    await incomes.mutate(
      'delete',
      (eventId) => api.deleteIncome(eventId, incomeId),
      { apply: (list) => removeById(list, incomeId), feedback: 'result' },
    );
  }

  return {
    incomes: incomes.data,
    isLoading: incomes.isLoading,
    error: incomes.error,
    fetchData,
    createIncome,
    updateIncome,
    deleteIncome,
  };
});
