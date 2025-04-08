import express from 'express';
import { auth } from '#middlewares/auth.middleware';
import profileController from './profile.controller.js';
import { controller } from '#utils/bindController';

const router = express.Router({ mergeParams: true });

router.get('/', auth(), controller(profileController, 'show'));
router.patch('/', auth(), controller(profileController, 'update'));
router.delete('/', auth(), controller(profileController, 'destroy'));

export default router;
