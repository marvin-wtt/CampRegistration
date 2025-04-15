import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import managerController from './manager.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router.';

const router = createRouter();

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
