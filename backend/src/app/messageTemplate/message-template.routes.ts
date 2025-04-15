import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import messageTemplateController from './message-template.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router.';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'index'),
);
router.get(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'store'),
);
router.patch(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'update'),
);
router.delete(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'destroy'),
);

export default router;
