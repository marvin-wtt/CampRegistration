import express from 'express';
import { auth } from 'middlewares';
import profileController from './profile.controller';

const router = express.Router({ mergeParams: true });

router.get('/', auth(), profileController.show);
router.put('/', auth(), profileController.update);

export default router;
