import { catchParamAsync } from 'utils/catchAsync';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { fileService } from 'services';
import express, { Request } from 'express';
import { auth, guard, multipart, validate } from 'middlewares';
import { and, or, campManager, campActive } from 'guards';
import { fileValidation } from 'validations';
import { fileController } from 'controllers';

const router = express.Router({ mergeParams: true });

router.param(
  'fileId',
  catchParamAsync(async (req, res, next, id) => {
    const camp = routeModel(req.models.camp);
    const file = await fileService.getModelFile('camp', camp.id, id);
    req.models.file = verifyModelExists(file);
    next();
  }),
);

const fileAccessMiddleware = async (
  req: Request,
): Promise<boolean | string> => {
  const file = routeModel(req.models.file);

  // Camp managers always have access to all files
  return file.accessLevel === 'public';
};

router.get(
  '/:fileId',
  guard(or(campManager, and(fileAccessMiddleware, campActive))),
  validate(fileValidation.show),
  fileController.show,
);
router.get(
  '/',
  auth(),
  guard(campManager),
  validate(fileValidation.index),
  fileController.index,
);
router.post(
  '/',
  auth(),
  guard(campManager),
  multipart('file'),
  validate(fileValidation.store),
  fileController.store,
);
router.delete(
  '/:fileId',
  auth(),
  guard(campManager),
  validate(fileValidation.destroy),
  fileController.destroy,
);

export default router;
