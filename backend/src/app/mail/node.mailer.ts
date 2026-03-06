import type { IMailer } from '#app/mail/mailer.types';
import type { BuiltMail } from '#app/mail/mail.types';
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

  async sendMail(payload: BuiltMail): Promise<void> {
    await this.transport.sendMail({
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      from: payload.from,
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments,
      priority: payload.priority,
      headers: payload.headers,
    });
  }

  async verify(): Promise<void> {
    await this.transport.verify();
  }

  close() {
    this.transport.close();
  }
}
