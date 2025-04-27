import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import bedController from './bed.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.post(
  '/',
  auth(),
  guard(campManager('camp.rooms.beds.create')),
  controller(bedController, 'store'),
);
router.patch(
  '/:bedId',
  auth(),
  guard(campManager('camp.rooms.beds.edit')),
  controller(bedController, 'update'),
);
router.delete(
  '/:bedId',
  auth(),
  guard(campManager('camp.rooms.beds.delete')),
  controller(bedController, 'destroy'),
);

export default router;
