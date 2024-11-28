import express from 'express';
import { multipart, validate, guard } from 'middlewares';
import fileValidation from './file.validation';
import fileController from './file.controller';
import { catchParamAsync } from 'utils/catchAsync';
import { verifyModelExists } from 'utils/verifyModel';
import fileService from './file.service';
import fileAccessGuard from 'guards/file.guard';

const router = express.Router({ mergeParams: true });

router.param(
  'fileId',
  catchParamAsync(async (req, res, id) => {
    const file = await fileService.getFileById(id);
    req.models.file = verifyModelExists(file);
  }),
);

router.get(
  '/:fileId',
  validate(fileValidation.stream),
  guard(fileAccessGuard),
  fileController.stream,
);

router.post('/', multipart('file'), fileController.store);

export default router;
