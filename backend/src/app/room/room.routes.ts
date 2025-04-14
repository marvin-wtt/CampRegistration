import express from 'express';
import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import { catchParamAsync } from '#utils/catchAsync';
import roomService from './room.service.js';
import roomController from './room.controller.js';
import bedRoutes from '#app/bed/bed.routes';
import { controller } from '#utils/bindController';

const router = express.Router({ mergeParams: true });

router.param(
  'roomId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const room = await roomService.getRoomById(camp.id, id);
    req.setModelOrFail('room', room);
  }),
);

router.use('/:roomId/beds', bedRoutes);

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(roomController, 'index'),
);
router.get(
  '/:roomId',
  auth(),
  guard(campManager),
  controller(roomController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  controller(roomController, 'store'),
);
router.patch(
  '/:roomId',
  auth(),
  guard(campManager),
  controller(roomController, 'update'),
);
router.delete(
  '/:roomId',
  auth(),
  guard(campManager),
  controller(roomController, 'destroy'),
);

export default router;
