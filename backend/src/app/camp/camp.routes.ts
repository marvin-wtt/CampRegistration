import { type Request } from 'express';
import { auth, guard } from '#middlewares/index';
import { or, campActive, campManager } from '#guards/index';
import campController from './camp.controller.js';
import managerService from '#app/manager/manager.service';
import campFileRoutes from './camp-files.routes.js';
import type {
  CampCreateData,
  CampQuery,
} from '@camp-registration/common/entities';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

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
  guard(or(campManager('camp.view'), campActive)),
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
  guard(campManager('camp.edit')),
  controller(campController, 'update'),
);
router.delete(
  '/:campId',
  auth(),
  guard(campManager('camp.delete')),
  controller(campController, 'destroy'),
);

export default router;
