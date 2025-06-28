import { catchParamAsync } from '#utils/catchAsync';
import fileController from '#app/file/file.controller';
import fileService from '#app/file/file.service';
import express from 'express';
import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
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

// This route is used to redirect to the file API endpoint
// In the future, it should serve the file model instead
router.get('/:fileId', (req, res) => {
  res.redirect('/api/v1/files/' + req.params.fileId);
});

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
