import express from 'express';
import { validate } from 'middlewares';
import feedbackValidation from './feedback.validation';
import feedbackController from './feedback.controller';

const router = express.Router();

router.post('/', validate(feedbackValidation.store), feedbackController.store);

export default router;
