import registrationController from './registration.controller';
import { auth, guard, validate } from 'middlewares';
import { campActive, campManager } from 'guards';
import express from 'express';
import registrationValidation from './registration.validation';
import registrationService from './registration.service';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import registrationFiles from './registration-files.routes';

const router = express.Router({ mergeParams: true });

router.param(
  'registrationId',
  catchParamAsync(async (req, res, id) => {
    const camp = routeModel(req.models.camp);
    const registration = await registrationService.getRegistrationById(
      camp.id,
      id,
    );
    req.models.registration = verifyModelExists(registration);
  }),
);

router.use('/:registrationId/files', registrationFiles);

router.get(
  '/',
  auth(),
  guard(campManager),
  validate(registrationValidation.index),
  registrationController.index,
);
router.get(
  '/:registrationId',
  auth(),
  guard(campManager),
  validate(registrationValidation.show),
  registrationController.show,
);
router.post(
  '/',
  guard(campActive),
  validate(registrationValidation.store),
  registrationController.store,
);
router.patch(
  '/:registrationId',
  auth(),
  guard(campManager),
  validate(registrationValidation.update),
  registrationController.update,
);
router.delete(
  '/:registrationId',
  auth(),
  guard(campManager),
  validate(registrationValidation.destroy),
  registrationController.destroy,
);
router.get(
  '/events',
  auth(),
  guard(campManager),
  validate(registrationValidation.events),
  registrationController.events,
);

export default router;
