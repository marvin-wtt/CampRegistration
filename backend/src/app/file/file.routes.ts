import express from 'express';
import { multipart } from 'middlewares';
import fileController from './file.controller';

const router = express.Router({ mergeParams: true });

router.post('/', multipart('file'), fileController.store);

export default router;
