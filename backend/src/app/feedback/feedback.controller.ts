import feedbackService from './feedback.service';
import { catchAndResolve } from 'utils/promiseUtils';
import { Request, Response } from 'express';

const store = async (req: Request, res: Response) => {
  const { message, email, location, userAgent } = req.body;

  await catchAndResolve(
    feedbackService.saveFeedback(message, location, userAgent, email),
  );
};

export default {
  store,
};
