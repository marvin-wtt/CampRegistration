import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { campManager } from 'guards';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import roomValidation from './room.validation';
import roomService from './room.service';
import roomController from './room.controller';
import bedRoutes from 'app/bed/bed.routes';

const router = express.Router({ mergeParams: true });

router.param(
  'roomId',
  catchParamAsync(async (req, res, id) => {
    const camp = routeModel(req.models.camp);
    const room = await roomService.getRoomById(camp.id, id);
    req.models.room = verifyModelExists(room);
  }),
);

router.use('/:roomId/beds', bedRoutes);

router.get(
  '/',
  auth(),
  guard(campManager),
  validate(roomValidation.index),
  roomController.index,
);
router.get(
  '/:roomId',
  auth(),
  guard(campManager),
  validate(roomValidation.show),
  roomController.show,
);
router.post(
  '/',
  auth(),
  guard(campManager),
  validate(roomValidation.store),
  roomController.store,
);
router.post(
  '/',
  auth(),
  guard(campManager),
  validate(roomValidation.store),
  roomController.store,
);
router.patch(
  '/:roomId',
  auth(),
  guard(campManager),
  validate(roomValidation.update),
  roomController.update,
);
router.delete(
  '/:roomId',
  auth(),
  guard(campManager),
  validate(roomValidation.destroy),
  roomController.destroy,
);

export default router;
