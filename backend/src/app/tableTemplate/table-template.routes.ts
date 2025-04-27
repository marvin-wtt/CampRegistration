import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import templateController from './table-template.controller.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.get(
  '/',
  auth(),
  guard(campManager('camp.table_templates.view')),
  controller(templateController, 'index'),
);
router.get(
  '/:tableTemplateId',
  auth(),
  guard(campManager('camp.table_templates.view')),
  controller(templateController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager('camp.table_templates.create')),
  controller(templateController, 'store'),
);
router.put(
  '/:tableTemplateId',
  auth(),
  guard(campManager('camp.table_templates.edit')),
  controller(templateController, 'update'),
);
router.delete(
  '/:tableTemplateId',
  auth(),
  guard(campManager('camp.table_templates.delete')),
  controller(templateController, 'destroy'),
);

export default router;
