import express from 'express';
import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import { catchParamAsync } from '#utils/catchAsync';
import bedService from './bed.service.js';
import bedController from './bed.controller.js';
import { controller } from '#utils/bindController.js';

const router = express.Router({ mergeParams: true });

router.param(
  'bedId',
  catchParamAsync(async (req, _res, id) => {
    const room = req.modelOrFail('room');
    const bed = await bedService.getBedById(id, room.id);
    req.setModelOrFail('bed', bed);
  }),
);

router.post(
  '/',
  auth(),
  guard(campManager),
  controller(bedController, 'store'),
);
router.patch(
  '/:bedId',
  auth(),
  guard(campManager),
  controller(bedController, 'update'),
);
router.delete(
  '/:bedId',
  auth(),
  guard(campManager),
  controller(bedController, 'destroy'),
);

export default router;
