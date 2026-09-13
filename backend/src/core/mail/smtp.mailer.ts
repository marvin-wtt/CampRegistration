import type { IMailer, SendMailResult } from '#core/mail/mailer.types';
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

  async sendMail(payload: BuiltMail): Promise<SendMailResult> {
    // Only request a report when something polls for it. ENVID doubles as the
    // correlation key: the server echoes it back verbatim as
    // Original-Envelope-Id (RFC 3464 §2.3.1), so reuse the Message-ID.
    const dsn: SendMailOptions['dsn'] =
      payload.dsn && payload.messageId && config.email.bounce
        ? {
            id: payload.messageId,
            notify: ['FAILURE'],
          }
        : undefined;

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
      messageId: payload.messageId,
      // An explicit envelope replaces the auto-generated one wholesale, so
      // the recipients have to be repeated here.
      envelope: {
        from: config.email.envelopeFrom,
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        dsn,
      },
    };

    const info = await this.transport.sendMail(mailOptions);

    // The sendmail fallback is a local handoff, so it reports no rejections.
    return { rejected: info.rejected ?? [] };
  }

  async verify(): Promise<void> {
    await this.transport.verify();
  }

  close() {
    this.transport.close();
  }
}
