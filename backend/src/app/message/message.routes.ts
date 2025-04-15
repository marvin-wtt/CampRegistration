import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import messageController from './message.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(messageController, 'index'),
);
router.get(
  '/:messageId',
  auth(),
  guard(campManager),
  controller(messageController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  multipart({ name: 'attachments' }),
  controller(messageController, 'store'),
);
router.post(
  '/:messageId/resend',
  auth(),
  guard(campManager),
  controller(messageController, 'resend'),
);
router.delete(
  '/:messageId',
  auth(),
  guard(campManager),
  controller(messageController, 'destroy'),
);

export default router;
