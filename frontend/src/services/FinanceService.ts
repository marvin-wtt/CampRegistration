import type { RecordView } from '@camp-registration/common/permissions';
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryCreateData,
  ExpenseCategoryOrderData,
  ExpenseCategoryUpdateData,
  ExpenseCreateData,
  ExpenseQuery,
  ExpenseUpdateData,
  FinanceBalance,
  FinanceParties,
  FinanceSettings,
  FinanceSettingsUpdateData,
  FinanceSummary,
  Payout,
  PayoutCreateData,
  PayoutSignatureData,
  PayoutUpdateData,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useFinanceService() {
  async function fetchExpenseCategories(
    eventId: string,
  ): Promise<ExpenseCategory[]> {
    const response = await api.get(`events/${eventId}/expense-categories/`);

    return response?.data?.data;
  }

  async function createExpenseCategory(
    eventId: string,
    data: ExpenseCategoryCreateData,
  ): Promise<ExpenseCategory> {
    const response = await api.post(
      `events/${eventId}/expense-categories/`,
      data,
    );

    return response?.data?.data;
  }

  async function updateExpenseCategory(
    eventId: string,
    categoryId: string,
    data: ExpenseCategoryUpdateData,
  ): Promise<ExpenseCategory> {
    const response = await api.patch(
      `events/${eventId}/expense-categories/${categoryId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function orderExpenseCategories(
    eventId: string,
    data: ExpenseCategoryOrderData,
  ): Promise<ExpenseCategory[]> {
    const response = await api.put(
      `events/${eventId}/expense-categories/order/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteExpenseCategory(
    eventId: string,
    categoryId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/expense-categories/${categoryId}/`);
  }

  async function fetchExpenses(
    eventId: string,
    query?: ExpenseQuery,
  ): Promise<Expense[]> {
    const response = await api.get(`events/${eventId}/expenses/`, {
      params: query,
    });

    return response?.data?.data;
  }

  async function fetchExpense(
    eventId: string,
    expenseId: string,
  ): Promise<Expense> {
    const response = await api.get(`events/${eventId}/expenses/${expenseId}/`);

    return response?.data?.data;
  }

  async function createExpense(
    eventId: string,
    data: ExpenseCreateData,
  ): Promise<Expense> {
    const response = await api.post(`events/${eventId}/expenses/`, data);

    return response?.data?.data;
  }

  async function updateExpense(
    eventId: string,
    expenseId: string,
    data: ExpenseUpdateData,
  ): Promise<Expense> {
    const response = await api.patch(
      `events/${eventId}/expenses/${expenseId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteExpense(
    eventId: string,
    expenseId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/expenses/${expenseId}/`);
  }

  async function fetchPayouts(
    eventId: string,
    view: RecordView,
  ): Promise<Payout[]> {
    const response = await api.get(`events/${eventId}/payouts/`, {
      params: { view },
    });

    return response?.data?.data;
  }

  async function createPayout(
    eventId: string,
    data: PayoutCreateData,
  ): Promise<Payout> {
    const response = await api.post(`events/${eventId}/payouts/`, data);

    return response?.data?.data;
  }

  async function updatePayout(
    eventId: string,
    payoutId: string,
    data: PayoutUpdateData,
  ): Promise<Payout> {
    const response = await api.patch(
      `events/${eventId}/payouts/${payoutId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function signPayout(
    eventId: string,
    payoutId: string,
    data: PayoutSignatureData,
  ): Promise<Payout> {
    const response = await api.put(
      `events/${eventId}/payouts/${payoutId}/signature/`,
      data,
    );

    return response?.data?.data;
  }

  async function unsignPayout(
    eventId: string,
    payoutId: string,
  ): Promise<Payout> {
    const response = await api.delete(
      `events/${eventId}/payouts/${payoutId}/signature/`,
    );

    return response?.data?.data;
  }

  async function deletePayout(
    eventId: string,
    payoutId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/payouts/${payoutId}/`);
  }

  async function fetchFinanceBalances(
    eventId: string,
    view: RecordView,
  ): Promise<FinanceBalance[]> {
    const response = await api.get(`events/${eventId}/finances/balances/`, {
      params: { view },
    });

    return response?.data?.data;
  }

  async function fetchFinanceSummary(eventId: string): Promise<FinanceSummary> {
    const response = await api.get(`events/${eventId}/finances/summary/`);

    return response?.data?.data;
  }

  async function fetchFinanceParties(eventId: string): Promise<FinanceParties> {
    const response = await api.get(`events/${eventId}/finances/parties/`);

    return response?.data?.data;
  }

  /** A download with the name the server gave it, if it gave one. */
  async function downloadFinanceFile(
    url: string,
  ): Promise<{ blob: Blob; filename: string | null }> {
    const response = await api.get(url, { responseType: 'blob' });
    const disposition = String(response.headers['content-disposition'] ?? '');
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);

    return {
      blob: response.data as Blob,
      filename: match?.[1] ? decodeURIComponent(match[1]) : null,
    };
  }

  function downloadFinanceExport(eventId: string, format: 'xlsx' | 'csv') {
    return downloadFinanceFile(
      `events/${eventId}/finances/export/?format=${format}`,
    );
  }

  function downloadFinanceReceipts(eventId: string) {
    return downloadFinanceFile(`events/${eventId}/finances/receipts/`);
  }

  async function fetchFinanceSettings(
    eventId: string,
  ): Promise<FinanceSettings> {
    const response = await api.get(`events/${eventId}/finances/settings/`);

    return response?.data?.data;
  }

  async function updateFinanceSettings(
    eventId: string,
    data: FinanceSettingsUpdateData,
  ): Promise<FinanceSettings> {
    const response = await api.patch(
      `events/${eventId}/finances/settings/`,
      data,
    );

    return response?.data?.data;
  }

  return {
    fetchExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    orderExpenseCategories,
    deleteExpenseCategory,
    fetchExpenses,
    fetchExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchPayouts,
    createPayout,
    updatePayout,
    deletePayout,
    signPayout,
    unsignPayout,
    fetchFinanceBalances,
    fetchFinanceSummary,
    fetchFinanceParties,
    fetchFinanceSettings,
    updateFinanceSettings,
    downloadFinanceExport,
    downloadFinanceReceipts,
  };
}
