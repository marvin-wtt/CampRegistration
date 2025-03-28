import express from 'express';
import feedbackController from './feedback.controller.js';
import { controller } from '#utils/bindController.js';

const router = express.Router();

router.post('/', controller(feedbackController, 'store'));

export default router;
