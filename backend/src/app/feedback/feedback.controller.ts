import feedbackService from './feedback.service.js';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from './feedback.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/BaseController.js';
import httpStatus from 'http-status';

class FeedbackController extends BaseController {
  async store(req: Request, res: Response) {
    const {
      body: { message, email, location, userAgent },
    } = await req.validate(validator.store);

    await catchAndResolve(
      feedbackService.saveFeedback(message, location, userAgent, email),
    );

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export default new FeedbackController();
