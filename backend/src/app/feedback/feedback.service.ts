import mailService from '#core/mail/mail.service.js';
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

    await mailService.sendTemplateMail({
      to: config.email.admin,
      subject: 'New Feedback',
      template: 'feedback',
      replyTo: email,
      context,
    });
  }
}

export default new FeedbackService();
