import { catchParamAsync } from 'utils/catchAsync';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import fileValidation from 'app/file/file.validation';
import fileController from 'app/file/file.controller';
import fileService from 'app/file/file.service';
import express, { Request } from 'express';
import { auth, guard, multipart, validate } from 'middlewares';
import { and, or, campManager, campActive } from 'guards';

const router = express.Router({ mergeParams: true });

router.param(
  'fileId',
  catchParamAsync(async (req, res, id) => {
    const camp = routeModel(req.models.camp);
    const file = await fileService.getModelFile('camp', camp.id, id);
    req.models.file = verifyModelExists(file);
  }),
);

const fileAccessMiddleware = async (
  req: Request,
): Promise<boolean | string> => {
  const file = routeModel(req.models.file);

  // Camp managers always have access to all files
  return file.accessLevel === 'public';
};

// TODO Files should be accessed via file route. This route is obsolete. Either redirect or delete
router.get(
  '/:fileId',
  guard(or(campManager, and(fileAccessMiddleware, campActive))),
  validate(fileValidation.show),
  fileController.stream,
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
