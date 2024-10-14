import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { campManager } from 'guards';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import bedValidation from './bed.validation';
import bedService from './bed.service';
import bedController from './bed.controller';

const router = express.Router({ mergeParams: true });

router.param(
  'bedId',
  catchParamAsync(async (req, res, id) => {
    const room = routeModel(req.models.room);
    const bed = await bedService.getBedById(id, room.id);
    req.models.bed = verifyModelExists(bed);
  }),
);

router.post(
  '/',
  auth(),
  guard(campManager),
  validate(bedValidation.store),
  bedController.store,
);
router.patch(
  '/:bedId',
  auth(),
  guard(campManager),
  validate(bedValidation.update),
  bedController.update,
);
router.delete(
  '/:bedId',
  auth(),
  guard(campManager),
  validate(bedValidation.destroy),
  bedController.destroy,
);

export default router;
