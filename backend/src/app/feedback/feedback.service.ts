import notificationService from '#app/notification/notification.service';
import config from '#config/index';

class FeedbackService {
  async saveFeedback(
    message: string,
    location?: string,
    userAgent?: string,
    email?: string | undefined,
  ) {
    const context = {
      message,
      location,
      userAgent,
    };

    await notificationService.sendEmail({
      to: config.email.admin,
      subject: 'New Feedback',
      template: 'feedback',
      replyTo: email,
      context,
    });
  }
}

export default new FeedbackService();
