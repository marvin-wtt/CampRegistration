import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import managerController from './manager.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager('camp.managers.view')),
  controller(managerController, 'index'),
);
router.post(
  '/',
  auth(),
  guard(campManager('camp.managers.create')),
  controller(managerController, 'store'),
);
router.patch(
  '/:managerId',
  auth(),
  guard(campManager('camp.managers.edit')),
  controller(managerController, 'update'),
);
router.delete(
  '/:managerId',
  auth(),
  guard(campManager('camp.managers.delete')),
  controller(managerController, 'destroy'),
);

export default router;
