import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import messageTemplateController from './message-template.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager('camp.message_templates.view')),
  controller(messageTemplateController, 'index'),
);
router.get(
  '/:messageTemplateId',
  auth(),
  guard(campManager('camp.message_templates.view')),
  controller(messageTemplateController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager('camp.message_templates.create')),
  controller(messageTemplateController, 'store'),
);
router.patch(
  '/:messageTemplateId',
  auth(),
  guard(campManager('camp.message_templates.edit')),
  controller(messageTemplateController, 'update'),
);
router.delete(
  '/:messageTemplateId',
  auth(),
  guard(campManager('camp.message_templates.delete')),
  controller(messageTemplateController, 'destroy'),
);

export default router;
