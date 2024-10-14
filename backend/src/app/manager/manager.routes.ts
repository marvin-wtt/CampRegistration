import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { auth, guard, validate } from 'middlewares';
import { campManager } from 'guards';
import managerValidation from './manager.validation';
import managerController from './manager.controller';
import managerService from './manager.service';
import { catchParamAsync } from 'utils/catchAsync';
import express from 'express';

const router = express.Router({ mergeParams: true });

router.param(
  'managerId',
  catchParamAsync(async (req, res, id) => {
    const camp = routeModel(req.models.camp);
    const manager = await managerService.getManagerById(camp.id, id);
    req.models.manager = verifyModelExists(manager);
  }),
);

router.get(
  '/',
  auth(),
  guard(campManager),
  validate(managerValidation.index),
  managerController.index,
);
router.post(
  '/',
  auth(),
  guard(campManager),
  validate(managerValidation.store),
  managerController.store,
);
router.delete(
  '/:managerId',
  auth(),
  guard(campManager),
  validate(managerValidation.destroy),
  managerController.destroy,
);

export default router;
