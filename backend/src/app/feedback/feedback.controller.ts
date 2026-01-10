import validator from './feedback.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import httpStatus from 'http-status';
import { FeedbackMessage } from '#app/feedback/feedback.messages';

class FeedbackController extends BaseController {
  async store(req: Request, res: Response) {
    const {
      body: { message, email, location, userAgent },
    } = await req.validate(validator.store);

    await FeedbackMessage.send({
      message,
      email,
      location,
      userAgent,
    });

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export default new FeedbackController();
