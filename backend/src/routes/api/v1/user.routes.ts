import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { userController } from 'controllers';
import { userValidation } from 'validations';
import { userService } from 'services';
import { verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';
import { admin } from 'guards';

const router = express.Router();

router.param(
  'userId',
  catchParamAsync(async (req, res, next, id) => {
    const user = await userService.getUserById(id);
    req.models.user = verifyModelExists(user);
    next();
  }),
);

router.get('/', auth(), guard(admin), userController.index);
router.get('/:userId', auth(), guard(admin), userController.show);
router.post(
  '/',
  auth(),
  guard(),
  validate(userValidation.store),
  userController.store,
);
router.put(
  '/:userId',
  auth(),
  guard(admin),
  validate(userValidation.update),
  userController.update,
);
router.delete(
  '/:userId',
  auth(),
  guard(admin),
  validate(userValidation.destroy),
  userController.destroy,
);

export default router;
