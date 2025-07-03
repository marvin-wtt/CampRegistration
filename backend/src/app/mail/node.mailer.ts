import type { IMailer, AdvancedMailPayload } from '#app/mail/mail.types';
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import config from '#config/index';

export class NodeMailer implements IMailer {
  private transport: Transporter;

  constructor() {
    const transportConfig = this.getConfig();

    // Create transport
    this.transport = nodemailer.createTransport(transportConfig);
  }

  private getConfig() {
    const mailOptions: SendMailOptions = {
      from: config.email.from,
      replyTo: config.email.replyTo,
    };

    // SMTP
    if (config.email.smtp.host) {
      return {
        ...config.email.smtp,
        ...mailOptions,
      };
    }

    // Sendmail
    return {
      sendmail: true,
      newline: 'unix',
      ...mailOptions,
      smtp: undefined,
    };
  }

  name(): string {
    return 'SMTP-Mailer';
  }

  async sendMail(payload: AdvancedMailPayload): Promise<void> {
    await this.transport.sendMail({
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

  close() {
    this.transport.close();
  }
}
