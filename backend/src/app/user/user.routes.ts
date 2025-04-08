import express from 'express';
import { auth, guard } from '#middlewares/index';
import userController from './user.controller.js';
import userService from './user.service.js';
import { catchParamAsync } from '#utils/catchAsync';
import { controller } from '#utils/bindController';

const router = express.Router();

router.param(
  'userId',
  catchParamAsync(async (req, _res, id) => {
    const user = await userService.getUserById(id);
    req.setModelOrFail('user', user);
  }),
);

router.get('/', auth(), guard(), controller(userController, 'index'));
router.get('/:userId', auth(), guard(), controller(userController, 'show'));
router.post('/', auth(), guard(), controller(userController, 'store'));
router.patch('/:userId', auth(), guard(), controller(userController, 'update'));
router.delete(
  '/:userId',
  auth(),
  guard(),
  controller(userController, 'destroy'),
);

export default router;
