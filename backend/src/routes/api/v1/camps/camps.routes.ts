import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { campValidation } from 'validations';
import { campController } from 'controllers';
import { or, campActive, campManager } from 'guards';
import { catchParamAsync } from 'utils/catchAsync';
import { campService } from 'services';
import { verifyModelExists } from 'utils/verifyModel';

const router = express.Router();

router.param(
  'campId',
  catchParamAsync(async (req, res, next, id) => {
    const camp = await campService.getCampById(id);
    req.models.camp = verifyModelExists(camp);
    next();
  }),
);

router.get('/', validate(campValidation.index), campController.index);
console.log('Lets go');
router.get(
  '/:campId',
  guard(or(campManager, campActive)),
  validate(campValidation.show),
  campController.show,
);
console.log('Done');
router.post('/', auth(), validate(campValidation.store), campController.store);
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
