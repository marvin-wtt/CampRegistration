import expenseService from '#app/expense/expense.service';
import { ExpenseResource } from '#app/expense/expense.resource';
import httpStatus from 'http-status';
import fileService from '#app/file/file.service';
import validator from '#app/expense/expense.validation';
import ApiError from '#utils/ApiError';
import {
  ExpenseWithFile,
  exportExpenses,
} from '#app/expense/expense.exporter.js';
import { BaseController } from '#core/base/BaseController.js';
import type { Request, Response } from 'express';

class ExpenseController extends BaseController {
  show(req: Request, res: Response) {
    const expense = req.modelOrFail('expense');

    res.resource(new ExpenseResource(expense));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
      query: { exportType },
    } = await req.validate(validator.index);

    const expenses = await expenseService.queryExpenses(campId);

    if (exportType != null && exportType !== 'json') {
      await exportExpenses(exportType, expenses, res);
      return;
    }

    res.resource(ExpenseResource.collection(expenses));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body,
    } = await req.validate(validator.store);

    const expense = await expenseService.createExpense(
      campId,
      {
        name: body.name,
        description: body.description,
        amount: body.amount,
        date: body.date,
        category: body.category,
        paidAt: body.paidAt,
        paidBy: body.paidBy,
        payee: body.payee,
      },
      req.file,
    );

    res.status(httpStatus.CREATED).resource(new ExpenseResource(expense));
  }

  async update(req: Request, res: Response) {
    const expense = req.modelOrFail('expense');
    const { body } = await req.validate(validator.update);
    const file = req.file;

    // This should never happen
    if (file != null && body.file === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid file data');
    }

    // Delete existing file if file is present and request file is defined
    // Must happen before updating the expense as the file is attached to the expense
    if ((body.file === null || file != null) && expense.file != null) {
      await fileService.deleteFile(expense.file.id);
    }

    const updatedExpense = await expenseService.updateExpenseById(
      expense.id,
      {
        receiptNumber: body.receiptNumber,
        name: body.name,
        description: body.description,
        amount: body.amount,
        date: body.date,
        category: body.category,
        paidAt: body.paidAt,
        paidBy: body.paidBy,
        payee: body.payee,
      },
      file,
    );

    res.resource(new ExpenseResource(updatedExpense));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { expenseId },
    } = await req.validate(validator.destroy);

    await expenseService.deleteExpenseById(expenseId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export default new ExpenseController();
