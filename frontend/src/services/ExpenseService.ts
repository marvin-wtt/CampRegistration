import type {
  Expense,
  ExpenseCreateData,
  ExpenseUpdateData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useExpenseService() {
  async function fetchExpenses(campId: string): Promise<Expense[]> {
    const response = await api.get(`camps/${campId}/expenses/`);

    return response?.data?.data;
  }

  async function fetchExpense(
    campId: string,
    expenseId: string,
  ): Promise<Expense> {
    const response = await api.get(`camps/${campId}/expenses/${expenseId}/`);

    return response?.data?.data;
  }

  async function createExpense(
    campId: string,
    data: ExpenseCreateData,
  ): Promise<Expense> {
    const response = await api.post(`camps/${campId}/expenses/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response?.data?.data;
  }

  async function updateExpense(
    campId: string,
    expenseId: string,
    data: ExpenseUpdateData,
  ): Promise<Expense> {
    const response = await api.patch(
      `camps/${campId}/expenses/${expenseId}/`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response?.data?.data;
  }

  async function deleteExpense(
    campId: string,
    expenseId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/expenses/${expenseId}/`);
  }

  async function exportExpenses(campId: string, type: string): Promise<string> {
    const response = await api.get(`camps/${campId}/expenses/`, {
      params: {
        exportType: type,
      },
      responseType: 'text',
    });

    return response?.data;
  }

  return {
    fetchExpenses,
    fetchExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    exportExpenses,
  };
}
