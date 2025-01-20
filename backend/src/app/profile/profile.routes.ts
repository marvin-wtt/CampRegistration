import express from 'express';
import { auth } from '#middlewares/auth.middleware';
import profileController from './profile.controller.js';

const router = express.Router({ mergeParams: true });

router.get('/', auth(), profileController.show);
router.patch('/', auth(), profileController.update);
router.delete('/', auth(), profileController.destroy);

export default router;
