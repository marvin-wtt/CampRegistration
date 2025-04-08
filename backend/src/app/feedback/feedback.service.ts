import mailService from '#core/mail/mail.service';
import config from '#config/index';
import { BaseService } from '#core/base/BaseService';

export class FeedbackService extends BaseService {
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
