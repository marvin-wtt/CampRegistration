import express from 'express';
import { auth, validate } from 'middlewares';
import { profileValidation } from 'validations';
import { profileController } from 'controllers';

const router = express.Router({ mergeParams: true });

router.get('/', auth(), profileController.show);
router.put(
  '/',
  auth(),
  validate(profileValidation.update),
  profileController.update,
);

export default router;
