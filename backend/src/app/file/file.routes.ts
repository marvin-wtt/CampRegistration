import express from 'express';
import { multipart, validate } from 'middlewares';
import fileValidation from './file.validation';
import fileController from './file.controller';

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  multipart('file'),
  validate(fileValidation.store),
  fileController.store,
);

export default router;
