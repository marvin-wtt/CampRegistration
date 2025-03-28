import express from 'express';
import { auth } from '#middlewares/auth.middleware';
import totpController from './totp.controller.js';
import { authLimiter } from '#middlewares/index';
import { controller } from '#utils/bindController';

const router = express.Router({ mergeParams: true });

router.use(authLimiter);

router.post('/setup', auth(), controller(totpController, 'setup'));
router.post('/enable', auth(), controller(totpController, 'enable'));
router.post('/disable', auth(), controller(totpController, 'disable'));

export default router;
