import { IMailer, MailPayload } from '#app/mail/mail.service';
import transport from '#core/mail';
// TODO Copy mailer form core here

export class NodeMailer implements IMailer {
  async sendEmail(payload: MailPayload): Promise<void> {
    return await transport.sendMail({
      to: payload.to,
      replyTo: payload.replyTo,
      from: payload.from,
      priority: payload.priority,
      subject: payload.subject,
      html: payload.body,
    });
  }
}
