import express from 'express';
import { multipart, guard } from '#middlewares/index';
import fileController from './file.controller.js';
import { controller } from '#utils/bindController';
import fileAccessGuard from './file.guard.js';

const router = express.Router({ mergeParams: true });

router.get(
  '/:fileId',
  guard(fileAccessGuard),
  controller(fileController, 'stream'),
);

router.post('/', multipart('file'), controller(fileController, 'store'));

export default router;
