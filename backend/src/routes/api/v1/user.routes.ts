import express from 'express';
import { auth, guard, validate } from 'middlewares';
import { userController } from 'controllers';
import { userValidation } from 'validations';
import { userService } from 'services';
import { verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';

const router = express.Router();

router.param(
  'userId',
  catchParamAsync(async (req, res, id) => {
    const user = await userService.getUserById(id);
    req.models.user = verifyModelExists(user);
  }),
);

router.get('/', auth(), guard(), userController.index);
router.get('/:userId', auth(), guard(), userController.show);
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
  guard(),
  validate(userValidation.update),
  userController.update,
);
router.delete(
  '/:userId',
  auth(),
  guard(),
  validate(userValidation.destroy),
  userController.destroy,
);

export default router;
