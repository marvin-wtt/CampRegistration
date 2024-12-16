import express from 'express';
import { catchParamAsync } from '#utils/catchAsync';
import { routeModel, verifyModelExists } from '#utils/verifyModel';
import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import fileController from '#app/file/file.controller';
import fileService from '#app/file/file.service';

const router = express.Router({ mergeParams: true });

// Files
router.param(
  'fileId',
  catchParamAsync(async (req, _res, id) => {
    const registration = routeModel(req.models.registration);
    const file = await fileService.getModelFile(
      'registration',
      registration.id,
      id,
    );
    req.models.file = verifyModelExists(file);
  }),
);

// TODO Files should be accessed via file route. This route is obsolete. Either redirect or delete
router.get('/:fileId', auth(), guard(campManager), fileController.stream);

export default router;
