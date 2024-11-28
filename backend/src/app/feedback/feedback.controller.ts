import { catchRequestAsync } from 'utils/catchAsync';
import feedbackService from './feedback.service';
import { catchAndResolve } from 'utils/promiseUtils';
import validator from './feedback.validation';
import { validateRequest } from 'core/validation/request';

const store = catchRequestAsync(async (req) => {
  const {
    body: { message, email, location, userAgent },
  } = await validateRequest(req, validator.store);

  await catchAndResolve(
    feedbackService.saveFeedback(message, location, userAgent, email),
  );
});

export default {
  store,
};
