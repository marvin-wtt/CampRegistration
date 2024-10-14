import { catchRequestAsync } from 'utils/catchAsync';
import { collection, resource } from 'app/resource';
import expenseService from './expense.service';
import expenseResource from './expense.resource';
import httpStatus from 'http-status';
import {
  ExpenseCreateData,
  ExpenseUpdateData,
} from '@camp-registration/common/entities';
import { routeModel } from 'utils/verifyModel';

const show = catchRequestAsync(async (req, res) => {
  const expense = routeModel(req.models.expense);

  res.json(resource(expenseResource(expense)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const expenses = await expenseService.queryExpenses(campId);

  const resources = expenses.map((value) => expenseResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const body = req.body as ExpenseCreateData;

  if (body.fileId) {
    // TODO Check if file exists
  }

  const expense = await expenseService.createExpense(campId, {
    name: body.name,
    description: body.description,
    amount: body.amount,
    date: body.date,
    category: body.category,
    paidAt: body.paidAt,
    paidBy: body.paidBy,
    recipient: body.recipient,
  });

  res.status(httpStatus.CREATED).json(resource(expenseResource(expense)));
});

const update = catchRequestAsync(async (req, res) => {
  const { expenseId } = req.params;
  const body = req.body as ExpenseUpdateData;

  if (body.fileId) {
    // TODO Check if file exists and delete existing file
  }

  const expense = await expenseService.updateExpenseById(expenseId, {
    name: body.name,
    description: body.description,
    amount: body.amount,
    date: body.date,
    category: body.category,
    paidAt: body.paidAt,
    paidBy: body.paidBy,
    recipient: body.recipient,
  });

  res.json(resource(expenseResource(expense)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { expenseId } = req.params;

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
