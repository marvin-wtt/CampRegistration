import { catchRequestAsync } from '#utils/catchAsync';
import { collection, resource } from '#core/resource';
import expenseService from '#app/expense/expense.service';
import expenseResource from '#app/expense/expense.resource';
import httpStatus from 'http-status';
import { routeModel } from '#utils/verifyModel';
import fileService from '#app/file/file.service';
import { validateRequest } from '#core/validation/request';
import validator from '#app/expense/expense.validation';

const show = catchRequestAsync(async (req, res) => {
  const expense = routeModel(req.models.expense);

  res.json(resource(expenseResource(expense)));
});

const index = catchRequestAsync(async (req, res) => {
  const {
    params: { campId },
  } = await validateRequest(req, validator.index);

  const expenses = await expenseService.queryExpenses(campId);

  const resources = expenses.map((value) => expenseResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const {
    params: { campId },
    body,
  } = await validateRequest(req, validator.store);

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

  res.status(httpStatus.CREATED).json(resource(expenseResource(expense)));
});

const update = catchRequestAsync(async (req, res) => {
  const expense = routeModel(req.models.expense);
  const { body } = await validateRequest(req, validator.update);
  const file = req.file;

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

  if (expense.file?.id != null && updatedExpense.file?.id != expense.file?.id) {
    await fileService.deleteFile(expense.file.id);
  }

  res.json(resource(expenseResource(updatedExpense)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const {
    params: { expenseId },
  } = await validateRequest(req, validator.destroy);

  await expenseService.deleteExpenseById(expenseId);

  res.sendStatus(httpStatus.NO_CONTENT);
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
