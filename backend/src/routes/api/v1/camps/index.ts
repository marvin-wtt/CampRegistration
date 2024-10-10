import express from 'express';
import { verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import { campService } from 'services';
import registrationRoutes from 'routes/api/v1/camps/registrations/registration.routes';
import templateRoutes from './template.routes';
import roomRoutes from './rooms/room.routes';
import managerRoutes from './manager.routes';
import campFileRoutes from './files.routes';
import campRoutes from './camps.routes';
import programEventRoutes from './program-event.routes';

const router = express.Router({ mergeParams: true });

router.param(
  'campId',
  catchParamAsync(async (req, res, id) => {
    const camp = await campService.getCampById(id);
    req.models.camp = verifyModelExists(camp);
  }),
);

router.use('/:campId/registrations', registrationRoutes);
router.use('/:campId/templates', templateRoutes);
router.use('/:campId/managers', managerRoutes);
router.use('/:campId/rooms', roomRoutes);
router.use('/:campId/files', campFileRoutes);
router.use('/:campId/program-events', programEventRoutes);
router.use(campRoutes);

export default router;
