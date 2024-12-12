import express from 'express';
import { auth, guard } from 'middlewares';
import { campManager } from 'guards';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
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

router.get('/', auth(), guard(campManager), roomController.index);
router.get('/:roomId', auth(), guard(campManager), roomController.show);
router.post('/', auth(), guard(campManager), roomController.store);
router.post('/', auth(), guard(campManager), roomController.store);
router.patch('/:roomId', auth(), guard(campManager), roomController.update);
router.delete('/:roomId', auth(), guard(campManager), roomController.destroy);

export default router;
