import express, { type Request } from 'express';
import { auth, guard } from '#middlewares/index';
import { or, campActive, campManager } from '#guards/index';
import { catchParamAsync } from '#utils/catchAsync';
import campController from './camp.controller.js';
import campService from './camp.service.js';
import managerService from '#app/manager/manager.service';
import campFileRoutes from './camp-files.routes.js';
import type {
  CampCreateData,
  CampQuery,
} from '@camp-registration/common/entities';
import { controller } from '#utils/bindController';

const router = express.Router();

router.param(
  'campId',
  catchParamAsync(async (req, _res, id) => {
    const camp = await campService.getCampById(id);
    req.setModelOrFail('camp', camp);
  }),
);

const queryShowAllGuard = (req: Request) => {
  const query = req.query as CampQuery;

  // Admins will bypass this guard
  return query.showAll === undefined;
};

const referenceCampGuard = (req: Request) => {
  const userId = req.authUserId();
  const { referenceCampId } = req.body as CampCreateData;

  if (!referenceCampId) {
    return true;
  }

  return managerService.campManagerExistsWithUserIdAndCampId(
    referenceCampId,
    userId,
  );
};

router.use('/:campId/files', campFileRoutes);

router.get('/', guard(queryShowAllGuard), controller(campController, 'index'));
router.get(
  '/:campId',
  guard(or(campManager, campActive)),
  controller(campController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(referenceCampGuard),
  controller(campController, 'store'),
);
router.patch(
  '/:campId',
  auth(),
  guard(campManager),
  controller(campController, 'update'),
);
router.delete(
  '/:campId',
  auth(),
  guard(campManager),
  controller(campController, 'destroy'),
);

export default router;
