import { catchRequestAsync } from 'utils/catchAsync';
import { feedbackService } from 'services';

const store = catchRequestAsync(async (req, res) => {
  const { message, email, location } = req.body;

  await feedbackService.saveFeedback(message, location, email);
});

export default {
  store,
};
