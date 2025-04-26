import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import roomController from './room.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager('camp.rooms.view')),
  controller(roomController, 'index'),
);
router.get(
  '/:roomId',
  auth(),
  guard(campManager('camp.rooms.view')),
  controller(roomController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager('camp.rooms.create')),
  controller(roomController, 'store'),
);
router.patch(
  '/:roomId',
  auth(),
  guard(campManager('camp.rooms.edit')),
  controller(roomController, 'update'),
);
router.delete(
  '/:roomId',
  auth(),
  guard(campManager('camp.rooms.delete')),
  controller(roomController, 'destroy'),
);

export default router;
