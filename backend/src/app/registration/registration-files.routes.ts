import express from 'express';
import { catchParamAsync } from '#utils/catchAsync';
import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import fileController from '#app/file/file.controller';
import fileService from '#app/file/file.service';

const router = express.Router({ mergeParams: true });

// Files
router.param(
  'fileId',
  catchParamAsync(async (req, _res, id) => {
    const registration = req.modelOrFail('registration');
    const file = await fileService.getModelFile(
      'registration',
      registration.id,
      id,
    );
    req.setModelOrFail('file', file);
  }),
);

// TODO Files should be accessed via file route. This route is obsolete. Either redirect or delete
router.get('/:fileId', auth(), guard(campManager), fileController.stream);

export default router;
