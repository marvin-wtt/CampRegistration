import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { campManager } from 'guards';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import { programPlannerService } from 'services';
import { programEventController } from 'controllers';
import { programEventValidation } from 'validations';

const router = express.Router({ mergeParams: true });

router.param(
  'programEventId',
  catchParamAsync(async (req, res, next, id) => {
    const camp = routeModel(req.models.camp);
    const template = await programPlannerService.getProgramEventById(
      camp.id,
      id,
    );
    req.models.template = verifyModelExists(template);
    next();
  }),
);

router.get(
  '/',
  auth(),
  guard([campManager]),
  validate(programEventValidation.index),
  programEventController.index,
);
router.get(
  '/:programEventId',
  auth(),
  guard([campManager]),
  validate(programEventValidation.show),
  programEventController.show,
);
router.post('/', auth(), guard([campManager]), programEventController.store);
router.put(
  '/:programEventId',
  auth(),
  guard([campManager]),
  validate(programEventValidation.update),
  programEventController.update,
);
router.delete(
  '/:programEventId',
  auth(),
  guard([campManager]),
  validate(programEventValidation.destroy),
  programEventController.destroy,
);

export default router;
