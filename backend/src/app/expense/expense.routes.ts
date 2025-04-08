import express from 'express';
import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import { catchParamAsync } from '#utils/catchAsync';
import expenseService from '#app/expense/expense.service';
import expenseController from '#app/expense/expense.controller';
import convertEmptyStringsToNull from '#middlewares/emptyStringNull.middleware.js';
import { controller } from '#utils/bindController.js';

const router = express.Router({ mergeParams: true });

router.param(
  'expenseId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const expense = await expenseService.getExpenseById(camp.id, id);
    req.setModelOrFail('expense', expense);
  }),
);

router.get('/', guard(campManager), controller(expenseController, 'index'));
router.get(
  '/:expenseId',
  guard(campManager),
  controller(expenseController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  multipart('file'),
  convertEmptyStringsToNull,
  controller(expenseController, 'store'),
);
router.patch(
  '/:expenseId',
  auth(),
  guard(campManager),
  multipart('file'),
  convertEmptyStringsToNull,
  controller(expenseController, 'update'),
);
router.delete(
  '/:expenseId',
  auth(),
  guard(campManager),
  controller(expenseController, 'destroy'),
);

export default router;
