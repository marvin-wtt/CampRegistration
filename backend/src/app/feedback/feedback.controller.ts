import feedbackService from './feedback.service.js';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from './feedback.validation.js';
import { type Request } from 'express';
import { BaseController } from '#core/BaseController.js';

class FeedbackController extends BaseController {
  async store(req: Request) {
    const {
      body: { message, email, location, userAgent },
    } = await req.validate(validator.store);

    await catchAndResolve(
      feedbackService.saveFeedback(message, location, userAgent, email),
    );
  }
}

export default new FeedbackController();
