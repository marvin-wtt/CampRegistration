import express from 'express';
import feedbackController from './feedback.controller';

const router = express.Router();

router.post('/', feedbackController.store);

export default router;
