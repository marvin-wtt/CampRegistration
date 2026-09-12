import type { IMailer } from '#core/mail/mailer.types';
import type { BuiltMail } from '#core/mail/mail.types';
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import config from '#config/index';

export class SmtpMailer implements IMailer {
  private transport: Transporter;

  constructor() {
    this.transport = this.createTransport();
  }

  private createTransport(): Transporter {
    const { email } = config;

    // SMTP
    if (email.smtp.host) {
      return nodemailer.createTransport(email.smtp);
    }

    // Sendmail
    return nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
    });
  }

  name(): string {
    return 'SMTP-Mailer';
  }

  async sendMail(payload: BuiltMail): Promise<void> {
    const mailOptions: SendMailOptions = {
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
      // Recipients must be repeated here: providing an envelope replaces the
      // auto-generated one entirely, it does not just override `from`.
      envelope: {
        from: config.email.envelopeFrom,
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
      },
    };

    await this.transport.sendMail(mailOptions);
  }

  async verify(): Promise<void> {
    await this.transport.verify();
  }

  close() {
    this.transport.close();
  }
}
