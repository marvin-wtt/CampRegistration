import express from 'express';
import { multipart, validate } from 'middlewares';
import { fileValidation } from 'validations';
import { fileController } from 'controllers';

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  multipart('file'),
  validate(fileValidation.store),
  fileController.store,
);

export default router;
