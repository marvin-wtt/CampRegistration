import express from 'express';
import { multipart } from '#middlewares/index';
import fileController from './file.controller.js';

const router = express.Router({ mergeParams: true });

router.post('/', multipart('file'), fileController.store);

export default router;
