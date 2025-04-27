import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import messageController from './message.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager('camp.messages.view')),
  controller(messageController, 'index'),
);
router.get(
  '/:messageId',
  auth(),
  guard(campManager('camp.messages.view')),
  controller(messageController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager('camp.messages.create')),
  multipart({ name: 'attachments' }),
  controller(messageController, 'store'),
);
router.post(
  '/:messageId/resend',
  auth(),
  guard(campManager('camp.messages.create')),
  controller(messageController, 'resend'),
);
router.delete(
  '/:messageId',
  auth(),
  guard(campManager('camp.messages.delete')),
  controller(messageController, 'destroy'),
);

export default router;
