import notificationService from 'app/notification/notification.service';
import config from 'config';

const saveFeedback = async (
  message: string,
  location?: string,
  userAgent?: string,
  email?: string | undefined,
) => {
  const context = {
    message,
    location,
    userAgent,
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
