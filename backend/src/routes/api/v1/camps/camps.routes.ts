import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { campValidation } from 'validations';
import { campController } from 'controllers';
import { admin, campActive, campManager } from 'guards';

const router = express.Router();

router.get('/', validate(campValidation.index), campController.index);
router.get(
  '/:campId',
  guard([admin, campManager, campActive]),
  validate(campValidation.show),
  campController.show,
);
router.post('/', auth(), validate(campValidation.store), campController.store);
router.patch(
  '/:campId',
  auth(),
  guard([admin, campManager]),
  validate(campValidation.update),
  campController.update,
);
router.delete(
  '/:campId',
  auth(),
  guard([admin, campManager]),
  validate(campValidation.destroy),
  campController.destroy,
);

export default router;
