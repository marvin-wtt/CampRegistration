import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import templateController from './table-template.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router.';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(templateController, 'index'),
);
router.get(
  '/:tableTemplateId',
  auth(),
  guard(campManager),
  controller(templateController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  controller(templateController, 'store'),
);
router.put(
  '/:tableTemplateId',
  auth(),
  guard(campManager),
  controller(templateController, 'update'),
);
router.delete(
  '/:tableTemplateId',
  auth(),
  guard(campManager),
  controller(templateController, 'destroy'),
);

export default router;
