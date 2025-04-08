import express from 'express';
import { multipart, guard } from '#middlewares/index';
import fileController from './file.controller.js';
import { controller } from '#utils/bindController';
import { catchParamAsync } from '#utils/catchAsync';
import { verifyModelExists } from '#utils/verifyModel';
import fileService from './file.service.js';
import fileAccessGuard from '#guards/file.guard';

const router = express.Router({ mergeParams: true });

router.param(
  'fileId',
  catchParamAsync(async (req, _res, id) => {
    const file = await fileService.getFileById(id);
    req.models.file = verifyModelExists(file);
  }),
);

router.get('/:fileId', guard(fileAccessGuard), controller(fileController, 'stream'));

router.post('/', multipart('file'), controller(fileController, 'store'));

export default router;
