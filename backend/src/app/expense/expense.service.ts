import type { Prisma } from '@prisma/client';
import { BaseService } from '#core/base/BaseService';

export class ExpenseService extends BaseService {
  async getExpenseById(campId: string, id: string) {
    return this.prisma.expense.findFirst({
      where: { id, campId },
      include: { file: true },
    });
  }

  async getExpenseWithCampById(id: string) {
    return this.prisma.expense.findFirst({
      where: { id },
      include: {
        camp: true,
        file: true,
      },
    });
  }

  async queryExpenses(campId: string) {
    return this.prisma.expense.findMany({
      where: { campId },
      include: { file: true },
    });
  }

  async createExpense(
    campId: string,
    data: Omit<Prisma.ExpenseCreateInput, 'id' | 'receiptNumber' | 'camp'>,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      const lastExpense = await prisma.expense.findFirst({
        where: { campId, receiptNumber: { not: null } },
        orderBy: { receiptNumber: 'desc' },
      });

      const receiptNumber = (lastExpense?.receiptNumber ?? 0) + 1;

      return prisma.expense.create({
        data: {
          ...data,
          receiptNumber,
          camp: { connect: { id: campId } },
        },
        include: { file: true },
      });
    });
  }

  updateExpenseById = async (
    id: string,
    data: Omit<Prisma.ExpenseUpdateInput, 'id'>,
  ) => {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...data,
      },
      include: { file: true },
    });
  };

  async deleteExpenseById(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }
}

export default new ExpenseService();
