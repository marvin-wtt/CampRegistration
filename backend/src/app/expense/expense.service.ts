import { ulid } from '#utils/ulid';
import type { Prisma } from '@prisma/client';
import { BaseService } from '#core/base/BaseService';

type RequestFile = Express.Multer.File;

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
    file?: RequestFile,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      const lastExpense = await prisma.expense.findFirst({
        where: { campId, receiptNumber: { not: null } },
        orderBy: { receiptNumber: 'desc' },
      });

      const receiptNumber = (lastExpense?.receiptNumber ?? 0) + 1;

      // Generate file data
      const fileData = this.createFileCreateData(file);

      // TODO Use storage
      // if (file) {
      //   await fileService.moveFileToStorage(file);
      // }

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
  }

  updateExpenseById = async (
    id: string,
    data: Omit<Prisma.ExpenseUpdateInput, 'id'>,
    file?: RequestFile,
  ) => {
    // Generate file data
    const fileData = this.createFileCreateData(file);

    // TODO Use storage
    // if (file) {
    //   await fileService.moveFileToStorage(file);
    // }

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...data,
        file: fileData,
      },
      include: { file: true },
    });
  };

  async deleteExpenseById(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  private createFileCreateData = (
    file?: RequestFile,
  ): Prisma.FileUpdateOneWithoutExpenseNestedInput | undefined => {
    if (!file) {
      return undefined;
    }

    // TODO Find a better way to implement this
    // return {
    //   create: fileService.modelFileCreateData(undefined, file),
    // };
  };
}

export default new ExpenseService();
