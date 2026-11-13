import { defineStore } from 'pinia';
import { exportFile } from 'quasar';
import { useAction } from '@/composables/action';
import { watch } from 'vue';
import { useAPIService } from '@/services/APIService';
import {
  useCollection,
  useResource,
  useRouteKey,
} from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import { usePermissions } from '@/composables/permissions';
import type {
  RecordView,
  ScopePermission,
} from '@camp-registration/common/permissions';
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryCreateData,
  ExpenseCategoryOrderData,
  ExpenseCategoryUpdateData,
  ExpenseCreateData,
  ExpenseUpdateData,
  FinanceBalance,
  FinanceParties,
  FinanceSettings,
  FinanceSettingsUpdateData,
  FinanceSummary,
  Payout,
  PayoutCreateData,
  PayoutUpdateData,
} from '@camp-registration/common/entities';

/**
 * Expenses, payouts and categories stay live; balances and the summary are
 * derived by the server, so they reload whenever either list changes —
 * here or, through realtime, elsewhere.
 */
export const useFinanceStore = defineStore('finance', () => {
  const api = useAPIService();
  const key = useRouteKey('eventId');
  const { canFor } = usePermissions();

  /** Everything with the full grant, otherwise what a `:own` grant reaches. */
  const viewFor = (
    eventId: string,
    permission: ScopePermission<'event'>,
  ): RecordView => (canFor(eventId, permission) ? 'all' : 'own');

  const expenses = useCollection<Expense>({
    name: 'expense',
    key,
    fetch: (eventId) =>
      api.fetchExpenses(eventId, {
        view: viewFor(eventId, 'event.expenses.view'),
      }),
    realtime: {
      resource: 'expense',
      fetchOne: (eventId, id) => api.fetchExpense(eventId, id),
    },
  });

  const payouts = useCollection<Payout>({
    name: 'payout',
    key,
    fetch: (eventId) =>
      api.fetchPayouts(eventId, viewFor(eventId, 'event.payouts.view')),
    realtime: { resource: 'payout' },
  });

  const categories = useCollection<ExpenseCategory>({
    name: 'expenseCategory',
    key,
    fetch: (eventId) => api.fetchExpenseCategories(eventId),
    realtime: { resource: 'expense_category' },
  });

  const balances = useResource<FinanceBalance[]>({
    name: 'finance',
    key,
    fetch: (eventId) =>
      api.fetchFinanceBalances(
        eventId,
        viewFor(eventId, 'event.expenses.view'),
      ),
  });

  const summary = useResource<FinanceSummary>({
    name: 'finance',
    key,
    fetch: (eventId) => api.fetchFinanceSummary(eventId),
  });

  const parties = useResource<FinanceParties>({
    name: 'finance',
    key,
    fetch: (eventId) => api.fetchFinanceParties(eventId),
  });

  const settings = useResource<FinanceSettings>({
    name: 'finance',
    key,
    fetch: (eventId) => api.fetchFinanceSettings(eventId),
  });

  // Derived data follows every change of what it is derived from, including
  // realtime ones; a first load (nothing before) has nothing to refresh.
  watch([expenses.data, payouts.data], (_next, [prevExpenses, prevPayouts]) => {
    if (prevExpenses === undefined || prevPayouts === undefined) {
      return;
    }
    void balances.reload();
    void summary.reload();
  });

  /** Everything the page shows except the summary, which needs its tab. */
  function fetchData() {
    return Promise.all([
      expenses.load(),
      payouts.load(),
      categories.load(),
      balances.load(),
      parties.load(),
      settings.load(),
    ]);
  }

  function loadSummary() {
    return summary.load();
  }

  /** After a failed load, which otherwise counts as loaded. */
  function retrySummary() {
    summary.invalidate();
    return summary.load();
  }

  // A free-text payer or recipient joins the suggestions.
  function reloadDerived() {
    void parties.reload();
  }

  async function createExpense(data: ExpenseCreateData): Promise<Expense> {
    const expense = await expenses.mutate(
      'create',
      (eventId) => api.createExpense(eventId, data),
      { apply: upsertById },
    );
    reloadDerived();
    return expense;
  }

  async function updateExpense(
    expenseId: string,
    data: ExpenseUpdateData,
  ): Promise<Expense> {
    const expense = await expenses.mutate(
      'update',
      (eventId) => api.updateExpense(eventId, expenseId, data),
      { apply: replaceById },
    );
    reloadDerived();
    return expense;
  }

  async function deleteExpense(expenseId: string): Promise<void> {
    await expenses.mutate(
      'delete',
      (eventId) => api.deleteExpense(eventId, expenseId),
      { apply: (list) => removeById(list, expenseId), feedback: 'result' },
    );
    reloadDerived();
  }

  async function createPayout(data: PayoutCreateData): Promise<Payout> {
    const payout = await payouts.mutate(
      'create',
      (eventId) => api.createPayout(eventId, data),
      { apply: upsertById, feedback: 'result' },
    );
    reloadDerived();
    // The first payout fixes the prefix.
    void settings.reload();
    return payout;
  }

  async function updatePayout(
    payoutId: string,
    data: PayoutUpdateData,
  ): Promise<Payout> {
    const payout = await payouts.mutate(
      'update',
      (eventId) => api.updatePayout(eventId, payoutId, data),
      { apply: replaceById },
    );
    reloadDerived();
    return payout;
  }

  /** The recipient's signature under the statement. */
  function signPayout(payoutId: string, signature: string): Promise<Payout> {
    return payouts.mutate(
      'sign',
      (eventId) => api.signPayout(eventId, payoutId, { signature }),
      { apply: replaceById, feedback: 'result' },
    );
  }

  function unsignPayout(payoutId: string): Promise<Payout> {
    return payouts.mutate(
      'unsign',
      (eventId) => api.unsignPayout(eventId, payoutId),
      { apply: replaceById, feedback: 'result' },
    );
  }

  async function deletePayout(payoutId: string): Promise<void> {
    await payouts.mutate(
      'delete',
      (eventId) => api.deletePayout(eventId, payoutId),
      { apply: (list) => removeById(list, payoutId), feedback: 'result' },
    );
    reloadDerived();
  }

  function createCategory(
    data: ExpenseCategoryCreateData,
  ): Promise<ExpenseCategory> {
    return categories.mutate(
      'create',
      (eventId) => api.createExpenseCategory(eventId, data),
      { apply: upsertById },
    );
  }

  function updateCategory(
    categoryId: string,
    data: ExpenseCategoryUpdateData,
  ): Promise<ExpenseCategory> {
    return categories.mutate(
      'update',
      (eventId) => api.updateExpenseCategory(eventId, categoryId, data),
      { apply: replaceById },
    );
  }

  function orderCategories(
    data: ExpenseCategoryOrderData,
  ): Promise<ExpenseCategory[]> {
    return categories.mutate(
      'order',
      (eventId) => api.orderExpenseCategories(eventId, data),
      {
        // Shown in place while the request runs.
        optimistic: (list) =>
          list.map((category) => {
            const item = data.items.find((i) => i.id === category.id);
            return item ? { ...category, ...item } : category;
          }),
        apply: (_list, result) => result,
      },
    );
  }

  async function deleteCategory(categoryId: string): Promise<void> {
    await categories.mutate(
      'delete',
      (eventId) => api.deleteExpenseCategory(eventId, categoryId),
      { apply: (list) => removeById(list, categoryId) },
    );
  }

  const { run } = useAction('finance');

  /** Saves the export or the receipt ZIP; a running toast for the slow ZIP. */
  async function download(kind: 'xlsx' | 'csv' | 'receipts'): Promise<void> {
    const eventId = key();
    if (!eventId) {
      return;
    }
    const { blob, filename } = await run(
      kind === 'receipts' ? 'downloadReceipts' : 'download',
      () =>
        kind === 'receipts'
          ? api.downloadFinanceReceipts(eventId)
          : api.downloadFinanceExport(eventId, kind),
      { feedback: kind === 'receipts' ? 'progress' : 'error' },
    );
    const extension = kind === 'receipts' ? 'zip' : kind;
    exportFile(filename ?? `finances.${extension}`, blob, {
      mimeType: blob.type,
    });
  }

  function updateSettings(
    data: FinanceSettingsUpdateData,
  ): Promise<FinanceSettings> {
    return settings.mutate(
      'updateSettings',
      (eventId) => api.updateFinanceSettings(eventId, data),
      { apply: (_current, result) => result, feedback: 'result' },
    );
  }

  return {
    expenses: expenses.data,
    payouts: payouts.data,
    categories: categories.data,
    balances: balances.data,
    summary: summary.data,
    summaryIsLoading: summary.isLoading,
    summaryError: summary.error,
    parties: parties.data,
    settings: settings.data,
    isLoading: expenses.isLoading,
    error: expenses.error,
    fetchData,
    loadSummary,
    retrySummary,
    createExpense,
    updateExpense,
    deleteExpense,
    createPayout,
    updatePayout,
    deletePayout,
    signPayout,
    unsignPayout,
    createCategory,
    updateCategory,
    orderCategories,
    deleteCategory,
    updateSettings,
    download,
  };
});
