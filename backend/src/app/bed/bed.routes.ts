import express from 'express';
import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import { routeModel, verifyModelExists } from '#utils/verifyModel';
import { catchParamAsync } from '#utils/catchAsync';
import bedService from './bed.service.js';
import bedController from './bed.controller.js';

const router = express.Router({ mergeParams: true });

router.param(
  'bedId',
  catchParamAsync(async (req, _res, id) => {
    const room = routeModel(req.models.room);
    const bed = await bedService.getBedById(id, room.id);
    req.models.bed = verifyModelExists(bed);
  }),
);

router.post('/', auth(), guard(campManager), bedController.store);
router.patch('/:bedId', auth(), guard(campManager), bedController.update);
router.delete('/:bedId', auth(), guard(campManager), bedController.destroy);

export default router;
