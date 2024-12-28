import express from 'express';
import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import { routeModel, verifyModelExists } from '#utils/verifyModel';
import { catchParamAsync } from '#utils/catchAsync';
import expenseService from '#app/expense/expense.service';
import expenseController from '#app/expense/expense.controller';
import convertEmptyStringsToNull from '#middlewares/emptyStringNull.middleware.js';

const router = express.Router({ mergeParams: true });

router.param(
  'expenseId',
  catchParamAsync(async (req, _res, id) => {
    const camp = routeModel(req.models.camp);
    const expense = await expenseService.getExpenseById(camp.id, id);
    req.models.expense = verifyModelExists(expense);
  }),
);

router.get('/', guard(campManager), expenseController.index);
router.get('/:expenseId', guard(campManager), expenseController.show);
router.post(
  '/',
  auth(),
  guard(campManager),
  multipart('file'),
  convertEmptyStringsToNull,
  expenseController.store,
);
router.patch(
  '/:expenseId',
  auth(),
  guard(campManager),
  multipart('file'),
  convertEmptyStringsToNull,
  expenseController.update,
);
router.delete(
  '/:expenseId',
  auth(),
  guard(campManager),
  expenseController.destroy,
);

export default router;
