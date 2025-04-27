import registrationController from './registration.controller.js';
import { auth, guard } from '#middlewares/index';
import { campActive, campManager } from '#guards/index';
import registrationFiles from './registration-files.routes.js';
import { controller } from '#utils/bindController';
import { createRouter } from '#core/router';

const router = createRouter();

router.use('/:registrationId/files', registrationFiles);

router.get(
  '/',
  auth(),
  guard(campManager('camp.registrations.view')),
  controller(registrationController, 'index'),
);
router.get(
  '/:registrationId',
  auth(),
  guard(campManager('camp.registrations.view')),
  controller(registrationController, 'show'),
);
router.post(
  '/',
  guard(campActive),
  controller(registrationController, 'store'),
);
router.patch(
  '/:registrationId',
  auth(),
  guard(campManager('camp.registrations.edit')),
  controller(registrationController, 'update'),
);
router.delete(
  '/:registrationId',
  auth(),
  guard(campManager('camp.registrations.delete')),
  controller(registrationController, 'destroy'),
);

export default router;
