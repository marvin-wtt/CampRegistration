import express from 'express';
import { catchParamAsync } from '#utils/catchAsync';
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

// This route is used to redirect to the file API endpoint
// In the future, it should serve the file model instead or be removed
router.get('/:fileId', (req, res) => {
  res.redirect('/api/v1/files/' + req.params.fileId);
});

export default router;
