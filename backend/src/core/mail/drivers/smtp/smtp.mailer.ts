import type { IMailer, SendMailResult } from '#core/mail/mailer.types';
import type { BuiltMail } from '#core/mail/mail.types';
import type { BounceHandler } from '#core/mail/bounce.types';
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import config from '#config/index';
import { BounceReader } from '#core/mail/drivers/smtp/bounce.reader';
import { resolve } from '#core/ioc/container';

export class SmtpMailer implements IMailer {
  private transport: Transporter;
  private bounceHandler: BounceHandler | undefined;

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

  async verifyBounceSource(): Promise<void> {
    if (!config.email.bounce) {
      return;
    }

    await resolve(BounceReader).verify();
  }

  setBounceHandler(handler: BounceHandler): void {
    this.bounceHandler = handler;
  }

  getBouncePollJob(): (() => Promise<void>) | undefined {
    if (!config.email.bounce) {
      return undefined;
    }

    const bounceReader = resolve(BounceReader);
    return () =>
      bounceReader.pollOnce(async (results) => {
        // Reads `this.bounceHandler` fresh on every run rather than closing
        // over a snapshot, so a handler swapped via `MailService.onBounce()`
        // later is picked up immediately. A failure here leaves the reports
        // unacknowledged for the next poll.
        await this.bounceHandler?.(results);
      });
  }

  close() {
    this.transport.close();
  }
}
