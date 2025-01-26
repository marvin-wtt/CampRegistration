import registrationController from './registration.controller.js';
import { auth, guard } from '#middlewares/index';
import { campActive, campManager } from '#guards/index';
import express from 'express';
import registrationService from './registration.service.js';
import { verifyModelExists } from '#utils/verifyModel';
import { catchParamAsync } from '#utils/catchAsync';
import registrationFiles from './registration-files.routes.js';

const router = express.Router({ mergeParams: true });

router.param(
  'registrationId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const registration = await registrationService.getRegistrationById(
      camp.id,
      id,
    );
    req.models.registration = verifyModelExists(registration);
  }),
);

router.use('/:registrationId/files', registrationFiles);

router.get('/', auth(), guard(campManager), registrationController.index);
router.get(
  '/:registrationId',
  auth(),
  guard(campManager),
  registrationController.show,
);
router.post('/', guard(campActive), registrationController.store);
router.patch(
  '/:registrationId',
  auth(),
  guard(campManager),
  registrationController.update,
);
router.delete(
  '/:registrationId',
  auth(),
  guard(campManager),
  registrationController.destroy,
);

export default router;
