import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { campManager } from 'guards';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import programPlannerService from './program-event.service';
import programEventController from './program-event.controller';
import programEventValidation from './program-event.validation';

const router = express.Router({ mergeParams: true });

router.param(
  'programEventId',
  catchParamAsync(async (req, res, id) => {
    const camp = routeModel(req.models.camp);
    const event = await programPlannerService.getProgramEventById(camp.id, id);
    req.models.programEvent = verifyModelExists(event);
  }),
);

router.get(
  '/',
  auth(),
  guard(campManager),
  validate(programEventValidation.index),
  programEventController.index,
);
router.get(
  '/:programEventId',
  auth(),
  guard(campManager),
  validate(programEventValidation.show),
  programEventController.show,
);
router.post(
  '/',
  auth(),
  guard(campManager),
  validate(programEventValidation.store),
  programEventController.store,
);
router.put(
  '/:programEventId',
  auth(),
  guard(campManager),
  validate(programEventValidation.update),
  programEventController.update,
);
router.delete(
  '/:programEventId',
  auth(),
  guard(campManager),
  validate(programEventValidation.destroy),
  programEventController.destroy,
);

export default router;
