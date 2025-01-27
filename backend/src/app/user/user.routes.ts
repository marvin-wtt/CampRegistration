import express from 'express';
import { auth, guard } from '#middlewares/index';
import userController from './user.controller.js';
import userService from './user.service.js';
import { catchParamAsync } from '#utils/catchAsync';

const router = express.Router();

router.param(
  'userId',
  catchParamAsync(async (req, _res, id) => {
    const user = await userService.getUserById(id);
    req.setModelOrFail('user', user);
  }),
);

router.get('/', auth(), guard(), userController.index);
router.get('/:userId', auth(), guard(), userController.show);
router.post('/', auth(), guard(), userController.store);
router.patch('/:userId', auth(), guard(), userController.update);
router.delete('/:userId', auth(), guard(), userController.destroy);

export default router;
