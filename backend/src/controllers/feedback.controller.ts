import { catchRequestAsync } from 'utils/catchAsync';
import { feedbackService } from 'services';
import { catchAndResolve } from '../utils/promiseUtils';

const store = catchRequestAsync(async (req) => {
  const { message, email, location } = req.body;

  await catchAndResolve(feedbackService.saveFeedback(message, location, email));
});

export default {
  store,
};
