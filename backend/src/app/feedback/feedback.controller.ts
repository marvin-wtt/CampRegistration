import { catchRequestAsync } from 'utils/catchAsync';
import feedbackService from './feedback.service';
import { catchAndResolve } from 'utils/promiseUtils';

const store = catchRequestAsync(async (req) => {
  const { message, email, location, userAgent } = req.body;

  await catchAndResolve(
    feedbackService.saveFeedback(message, location, userAgent, email),
  );
});

export default {
  store,
};
