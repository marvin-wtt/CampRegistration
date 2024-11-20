import express from 'express';
import { auth, guard, multipart, validate } from 'middlewares';
import { campManager } from 'guards';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import expenseValidation from './expense.validation';
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

router.get(
  '/',
  guard(campManager),
  validate(expenseValidation.index),
  expenseController.index,
);
router.get(
  '/:expenseId',
  guard(campManager),
  validate(expenseValidation.show),
  expenseController.show,
);
router.post(
  '/',
  auth(),
  guard(campManager),
  multipart('file'),
  validate(expenseValidation.store),
  expenseController.store,
);
router.put(
  '/:expenseId',
  auth(),
  guard(campManager),
  multipart('file'),
  validate(expenseValidation.update),
  expenseController.update,
);
router.delete(
  '/:expenseId',
  auth(),
  guard(campManager),
  validate(expenseValidation.destroy),
  expenseController.destroy,
);

export default router;
