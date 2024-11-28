import express from 'express';
import { auth, guard, multipart } from 'middlewares';
import { campManager } from 'guards';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import expenseService from './expense.service';
import expenseController from './expense.controller';

const router = express.Router({ mergeParams: true });

router.param(
  'expenseId',
  catchParamAsync(async (req, res, id) => {
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
  expenseController.store,
);
router.patch(
  '/:expenseId',
  auth(),
  guard(campManager),
  multipart('file'),
  expenseController.update,
);
router.delete(
  '/:expenseId',
  auth(),
  guard(campManager),
  expenseController.destroy,
);

export default router;
