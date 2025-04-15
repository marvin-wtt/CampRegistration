import { auth, guard } from '#middlewares/index';
import userController from './user.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.get('/', auth(), guard(), controller(userController, 'index'));
router.get('/:userId', auth(), guard(), controller(userController, 'show'));
router.post('/', auth(), guard(), controller(userController, 'store'));
router.patch('/:userId', auth(), guard(), controller(userController, 'update'));
router.delete(
  '/:userId',
  auth(),
  guard(),
  controller(userController, 'destroy'),
);

export default router;
