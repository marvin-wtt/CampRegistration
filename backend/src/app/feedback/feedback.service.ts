import mailService from '#core/mail/mail.service.js';
import config from '#config/index';
import { BaseService } from '#core/BaseService.js';

class FeedbackService extends BaseService {
  async saveFeedback(
    message: string,
    location?: string,
    userAgent?: string,
    email?: string,
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
