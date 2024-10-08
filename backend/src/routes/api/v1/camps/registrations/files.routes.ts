import express from 'express';
import { catchParamAsync } from 'utils/catchAsync';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { fileService } from 'services';
import { auth, guard, validate } from 'middlewares';
import { campManager } from 'guards';
import { fileValidation } from 'validations';
import { fileController } from 'controllers';

const router = express.Router({ mergeParams: true });

// Files
router.param(
  'fileId',
  catchParamAsync(async (req, res, id) => {
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
router.get(
  '/:fileId',
  auth(),
  guard(campManager),
  validate(fileValidation.show),
  fileController.stream,
);

export default router;
