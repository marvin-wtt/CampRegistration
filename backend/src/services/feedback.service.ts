import { notificationService } from 'services';
import config from 'config';

const saveFeedback = async (
  message: string,
  location: string,
  email?: string | undefined,
) => {
  const context = {
    message,
    location,
  };

  // TODO Store to DB instead

  await notificationService.sendEmail({
    to: config.email.admin,
    subject: 'New Feedback',
    template: 'feedback',
    replyTo: email,
    context,
  });
};

export default {
  saveFeedback,
};
