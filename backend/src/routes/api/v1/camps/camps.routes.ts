import express, { Request } from 'express';
import { auth, guard, validate } from 'middlewares';
import { campValidation } from 'validations';
import { campController } from 'controllers';
import { or, campActive, campManager } from 'guards';
import { catchParamAsync } from 'utils/catchAsync';
import { campService, managerService } from 'services';
import { verifyModelExists } from 'utils/verifyModel';
import { CampCreateData, CampQuery } from '@camp-registration/common/entities';
import { authUserId } from 'utils/authUserId';

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
