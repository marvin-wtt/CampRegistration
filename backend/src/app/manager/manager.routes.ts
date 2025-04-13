import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import managerController from './manager.controller.js';
import managerService from './manager.service.js';
import { catchParamAsync } from '#utils/catchAsync';
import express from 'express';
import { controller } from '#utils/bindController.js';

const router = express.Router({ mergeParams: true });

router.param(
  'managerId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const manager = await managerService.getManagerById(camp.id, id);
    req.setModelOrFail('manager', manager);
  }),
);

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(managerController, 'index'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  controller(managerController, 'store'),
);
router.patch(
  '/:managerId',
  auth(),
  guard(campManager),
  controller(managerController, 'update'),
);
router.delete(
  '/:managerId',
  auth(),
  guard(campManager),
  controller(managerController, 'destroy'),
);

export default router;
