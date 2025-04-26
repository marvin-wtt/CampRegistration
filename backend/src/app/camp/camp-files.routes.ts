import { catchParamAsync } from '#utils/catchAsync';
import fileController from '#app/file/file.controller';
import fileService from '#app/file/file.service';
import express, { type Request } from 'express';
import { auth, guard, multipart } from '#middlewares/index';
import { and, or, campManager, campActive } from '#guards/index';
import { controller } from '#utils/bindController';

const router = express.Router({ mergeParams: true });

router.param(
  'fileId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const file = await fileService.getModelFile('camp', camp.id, id);
    req.setModelOrFail('file', file);
  }),
);

const fileAccessMiddleware = (req: Request): boolean | string => {
  const file = req.modelOrFail('file');

  // Camp managers always have access to all files
  return file.accessLevel === 'public';
};

// TODO Files should be accessed via file route. This route is obsolete. Either redirect or delete
router.get(
  '/:fileId',
  guard(
    or(campManager('camp.files.view'), and(fileAccessMiddleware, campActive)),
  ),
  controller(fileController, 'stream'),
);
router.get(
  '/',
  auth(),
  guard(campManager('camp.files.view')),
  controller(fileController, 'index'),
);
router.post(
  '/',
  auth(),
  guard(campManager('camp.files.create')),
  multipart('file'),
  controller(fileController, 'store'),
);
router.delete(
  '/:fileId',
  auth(),
  guard(campManager('camp.files.delete')),
  controller(fileController, 'destroy'),
);

export default router;
