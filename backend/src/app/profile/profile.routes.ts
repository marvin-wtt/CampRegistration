import express from 'express';
import { auth } from '#middlewares/auth.middleware';
import profileController from './profile.controller.js';

const router = express.Router({ mergeParams: true });

router.get('/', auth(), profileController.show);
router.put('/', auth(), profileController.update);

export default router;
