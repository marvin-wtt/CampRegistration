import express from 'express';
import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import expenseController from '#app/expense/expense.controller';
import convertEmptyStringsToNull from '#middlewares/emptyStringNull.middleware.js';
import { controller } from '#utils/bindController.js';

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  guard(campManager('camp.expenses.view')),
  controller(expenseController, 'index'),
);
router.get(
  '/:expenseId',
  guard(campManager('camp.expenses.view')),
  controller(expenseController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager('camp.expenses.create')),
  multipart('file'),
  convertEmptyStringsToNull,
  controller(expenseController, 'store'),
);
router.patch(
  '/:expenseId',
  auth(),
  guard(campManager('camp.expenses.edit')),
  multipart('file'),
  convertEmptyStringsToNull,
  controller(expenseController, 'update'),
);
router.delete(
  '/:expenseId',
  auth(),
  guard(campManager('camp.expenses.delete')),
  controller(expenseController, 'destroy'),
);

export default router;
