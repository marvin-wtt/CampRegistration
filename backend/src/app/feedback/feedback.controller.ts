import feedbackService from './feedback.service.js';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from './feedback.validation.js';
import { type Request } from 'express';

const store = async (req: Request) => {
  const {
    body: { message, email, location, userAgent },
  } = await req.validate(validator.store);

  await catchAndResolve(
    feedbackService.saveFeedback(message, location, userAgent, email),
  );
};

export default {
  store,
};
