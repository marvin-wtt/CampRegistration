import express from 'express';
import { multipart } from '#middlewares/index';
import fileController from './file.controller.js';
import { controller } from '#utils/bindController';

const router = express.Router({ mergeParams: true });

router.post('/', multipart('file'), controller(fileController, 'stream'));

export default router;
