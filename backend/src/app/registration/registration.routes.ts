import registrationController from './registration.controller.js';
import { auth, guard } from '#middlewares/index';
import { campActive, campManager } from '#guards/index';
import express from 'express';
import registrationService from './registration.service.js';
import { catchParamAsync } from '#utils/catchAsync';
import registrationFiles from './registration-files.routes.js';
import { controller } from '#utils/bindController.js';

const router = express.Router({ mergeParams: true });

router.param(
  'registrationId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const registration = await registrationService.getRegistrationById(
      camp.id,
      id,
    );
    req.setModelOrFail('registration', registration);
  }),
);

router.use('/:registrationId/files', registrationFiles);

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(registrationController, 'index'),
);
router.get(
  '/:registrationId',
  auth(),
  guard(campManager),
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
  guard(campManager),
  controller(registrationController, 'update'),
);
router.delete(
  '/:registrationId',
  auth(),
  guard(campManager),
  controller(registrationController, 'destroy'),
);

export default router;
