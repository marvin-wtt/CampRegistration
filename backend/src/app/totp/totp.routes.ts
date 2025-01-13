import express from 'express';
import { auth } from '#middlewares/auth.middleware';
import totpController from './totp.controller.js';
import { authLimiter } from '#middlewares/index.js';

const router = express.Router({ mergeParams: true });

router.use(authLimiter);

router.post('/setup', auth(), totpController.setup);
router.post('/enable', auth(), totpController.enable);
router.post('/disable', auth(), totpController.disable);

export default router;
