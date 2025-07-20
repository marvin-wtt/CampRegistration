import expenseService from '#app/expense/expense.service';
import { ExpenseResource } from '#app/expense/expense.resource';
import httpStatus from 'http-status';
import fileService from '#app/file/file.service';
import validator from '#app/expense/expense.validation';
import { exportExpenses } from '#app/expense/expense.exporter';
import { BaseController } from '#core/base/BaseController';
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
      const { filename, contentType, stream } = await exportExpenses(
        exportType,
        ExpenseResource.collection(expenses).transform(),
        req.preferredLocale(),
        res,
      );

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      stream.pipe(res);
      return;
    }

    res.resource(ExpenseResource.collection(expenses));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body,
      file,
    } = await req.validate(validator.store);

    const expense = await expenseService.createExpense(campId, {
      name: body.name,
      description: body.description,
      amount: body.amount,
      date: body.date,
      category: body.category,
      paidAt: body.paidAt,
      paidBy: body.paidBy,
      payee: body.payee,
    });

    // If a file is provided, save it and attach it to the expense
    if (file) {
      expense.file = await fileService.saveModelFile(
        { name: 'expense', id: expense.id },
        file,
        expense.receiptNumber?.toString(),
      );
    }

    res.status(httpStatus.CREATED).resource(new ExpenseResource(expense));
  }

  async update(req: Request, res: Response) {
    const expense = req.modelOrFail('expense');
    const { body, file } = await req.validate(validator.update);

    // Delete the existing file if the file is present and the request file is defined
    // Must happen before updating the expense as the file is attached to the expense
    if ((body.file === null || file != null) && expense.file != null) {
      await fileService.deleteFile(expense.file.id);
    }

    const updatedExpense = await expenseService.updateExpenseById(expense.id, {
      receiptNumber: body.receiptNumber,
      name: body.name,
      description: body.description,
      amount: body.amount,
      date: body.date,
      category: body.category,
      paidAt: body.paidAt,
      paidBy: body.paidBy,
      payee: body.payee,
    });

    // If a file is provided, save it and attach it to the expense
    if (file) {
      updatedExpense.file = await fileService.saveModelFile(
        { name: 'expense', id: expense.id },
        file,
        expense.receiptNumber?.toString(),
      );
    }

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
