import prisma from 'client';
import { ulid } from 'utils/ulid';
import type { Prisma } from '@prisma/client';
import fileService from 'app/file/file.service';

type RequestFile = Express.Multer.File;

const getExpenseById = async (id: string) => {
  return prisma.expense.findFirst({
    where: { id },
    include: { file: true },
  });
};

const queryExpenses = async (campId: string) => {
  return prisma.expense.findMany({
    where: { campId },
    include: { file: true },
  });
};

const createExpense = async (
  campId: string,
  data: Omit<Prisma.ExpenseCreateInput, 'id' | 'receiptNumber' | 'camp'>,
  file?: RequestFile,
) => {
  return prisma.$transaction(async (prisma) => {
    const lastExpense = await prisma.expense.findFirst({
      where: { campId, receiptNumber: { not: null } },
      orderBy: { receiptNumber: 'desc' },
    });

    const receiptNumber = (lastExpense?.receiptNumber ?? 0) + 1;

    // Generate file data
    const fileData = createFileCreateData(file);

    if (file) {
      await fileService.moveFileToStorage(file);
    }

    return prisma.expense.create({
      data: {
        ...data,
        id: ulid(),
        receiptNumber,
        camp: { connect: { id: campId } },
        file: fileData,
      },
      include: { file: true },
    });
  });
};

const updateExpenseById = async (
  id: string,
  data: Omit<Prisma.ExpenseUpdateInput, 'id'>,
  file?: RequestFile,
) => {
  // Generate file data
  const fileData = createFileCreateData(file);

  if (file) {
    await fileService.moveFileToStorage(file);
  }

  return prisma.expense.update({
    where: { id },
    data: {
      ...data,
      file: fileData,
    },
    include: { file: true },
  });
};

const deleteExpenseById = async (id: string) => {
  return prisma.expense.delete({
    where: { id },
  });
};

const createFileCreateData = (
  file?: RequestFile,
): Prisma.FileUpdateOneWithoutExpenseNestedInput | undefined => {
  if (!file) {
    return undefined;
  }

  return {
    create: fileService.modelFileCreateData(undefined, file),
  };
};

export default {
  getExpenseById,
  queryExpenses,
  createExpense,
  updateExpenseById,
  deleteExpenseById,
};
