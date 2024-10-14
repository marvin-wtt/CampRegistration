import prisma from 'client';
import { ulid } from 'ulidx';
import type { Prisma } from '@prisma/client';

const getExpenseById = async (id: string) => {
  return prisma.expense.findFirst({
    where: { id },
  });
};

const queryExpenses = async (campId: string) => {
  return prisma.expense.findMany({
    where: { campId },
  });
};

const createExpense = async (
  campId: string,
  data: Omit<Prisma.ExpenseCreateInput, 'id' | 'receiptNumber' | 'camp'>,
) => {
  return prisma.$transaction(async (prisma) => {
    const lastExpense = await prisma.expense.findFirst({
      where: { id: campId, receiptNumber: { not: null } },
      orderBy: { receiptNumber: 'desc' },
    });

    const receiptNumber = (lastExpense?.receiptNumber ?? 0) + 1;

    return prisma.expense.create({
      data: {
        ...data,
        id: ulid(),
        receiptNumber,
        camp: { connect: { id: campId } },
      },
    });
  });
};

const updateExpenseById = async (
  id: string,
  data: Omit<Prisma.ExpenseUpdateInput, 'id'>,
) => {
  return prisma.expense.update({
    where: { id },
    data,
  });
};

const deleteExpenseById = async (id: string) => {
  return prisma.expense.delete({
    where: {
      id,
    },
  });
};

export default {
  getExpenseById,
  queryExpenses,
  createExpense,
  updateExpenseById,
  deleteExpenseById,
};
