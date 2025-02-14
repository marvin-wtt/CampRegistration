import { IMailer, AdvancedMailPayload } from '#app/mail/mail.service';
import nodemailer, { type Transporter } from 'nodemailer';
import config from '#config/index.js';

export class NodeMailer implements IMailer {
  private transport: Transporter;

  constructor() {
    const sendmailOptions = {
      sendmail: true,
      newline: 'unix',
      smtp: undefined,
    };

    const options = config.email.smtp.host
      ? config.email.smtp
      : sendmailOptions;

    // Create transport
    this.transport = nodemailer.createTransport({
      from: config.email.from,
      replyTo: config.email.replyTo,
      ...options,
    });
  }

  name(): string {
    return 'SMTP-Mailer';
  }

  async sendEmail(payload: AdvancedMailPayload): Promise<void> {
    return await this.transport.sendMail({
      to: payload.to,
      replyTo: payload.replyTo,
      from: payload.from,
      priority: payload.priority,
      subject: payload.subject,
      html: payload.body,
    });
  }

  async isAvailable(): Promise<boolean> {
    return this.transport.verify();
  }
}
