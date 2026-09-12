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
    // A mailable requesting DSN only reaches the wire when bounce reading is
    // actually configured — requesting a report nobody polls for is
    // pointless. ENVID doubles as the correlation key: the receiving server
    // must echo it back verbatim as Original-Envelope-Id in the bounce
    // report (RFC 3464 §2.3.1), so reuse the same Message-ID rather than a
    // separate id.
    const dsn: SendMailOptions['dsn'] =
      payload.dsn && payload.messageId && config.email.bounce
        ? {
            notify: payload.dsn.notify.join(','),
            envid: payload.messageId,
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
      // Recipients must be repeated here: providing an envelope replaces the
      // auto-generated one entirely, it does not just override `from`.
      envelope: {
        from: config.email.envelopeFrom,
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        dsn,
      },
    };

    const info = await this.transport.sendMail(mailOptions);

    // The sendmail-binary fallback doesn't report rejections at all (it's a
    // local process handoff, not a live SMTP negotiation).
    return { rejected: info.rejected ?? [] };
  }

  async verify(): Promise<void> {
    await this.transport.verify();
  }

  close() {
    this.transport.close();
  }
}
