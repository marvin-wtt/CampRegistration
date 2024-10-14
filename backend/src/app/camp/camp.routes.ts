import express, { Request } from 'express';
import { auth, guard, validate } from 'middlewares';
import { or, campActive, campManager } from 'guards';
import { catchParamAsync } from 'utils/catchAsync';
import { verifyModelExists } from 'utils/verifyModel';
import { authUserId } from 'utils/authUserId';
import campValidation from './camp.validation';
import campController from './camp.controller';
import campService from './camp.service';
import managerRoutes from 'app/manager/manager.routes';
import managerService from 'app/manager/manager.service';
import registrationRoutes from 'app/registration/registration.routes';
import tableTemplateRoutes from 'app/tableTemplate/table-template.routes';
import roomRoutes from 'app/room/room.routes';
import campFileRoutes from './camp-files.routes';
import { CampCreateData, CampQuery } from '@camp-registration/common/entities';

const router = express.Router();

router.param(
  'campId',
  catchParamAsync(async (req, res, id) => {
    const camp = await campService.getCampById(id);
    req.models.camp = verifyModelExists(camp);
  }),
);

const queryShowAllGuard = (req: Request) => {
  const query = req.query as CampQuery;

  // Admins will bypass this guard
  return query.showAll != true;
};

const referenceCampGuard = (req: Request) => {
  const userId = authUserId(req);
  const { referenceCampId } = req.body as CampCreateData;

  if (!referenceCampId) {
    return true;
  }

  return managerService.campManagerExistsWithUserIdAndCampId(
    referenceCampId,
    userId,
  );
};

router.use('/:campId/registrations', registrationRoutes);
router.use('/:campId/templates', tableTemplateRoutes);
router.use('/:campId/managers', managerRoutes);
router.use('/:campId/rooms', roomRoutes);
router.use('/:campId/files', campFileRoutes);

router.get(
  '/',
  validate(campValidation.index),
  guard(queryShowAllGuard),
  campController.index,
);
router.get(
  '/:campId',
  guard(or(campManager, campActive)),
  validate(campValidation.show),
  campController.show,
);
router.post(
  '/',
  auth(),
  validate(campValidation.store),
  guard(referenceCampGuard),
  campController.store,
);
router.patch(
  '/:campId',
  auth(),
  guard(campManager),
  validate(campValidation.update),
  campController.update,
);
router.delete(
  '/:campId',
  auth(),
  guard(campManager),
  validate(campValidation.destroy),
  campController.destroy,
);

export default router;
