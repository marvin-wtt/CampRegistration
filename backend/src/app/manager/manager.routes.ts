import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { auth, guard } from 'middlewares';
import { campManager } from 'guards';
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

router.get('/', auth(), guard(campManager), managerController.index);
router.post('/', auth(), guard(campManager), managerController.store);
router.delete(
  '/:managerId',
  auth(),
  guard(campManager),
  managerController.destroy,
);

export default router;
