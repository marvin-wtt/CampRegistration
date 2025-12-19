import type { Message } from '@prisma/client';
import config from '#config/index';
import renderer from '#app/mail/mail.renderer';
import { MailFactory } from '#app/mail/mail.factory';
import logger from '#core/logger';
import { NoOpMailer } from '#app/mail/noop.mailer';
import type { IMailer } from '#app/mail/mailer.types';
import type { MailPriority, BuiltMail } from '#app/mail/mail.types';
import { mailQueue } from '#app/mail/mail.queue';
import type { MailBase } from '#app/mail/mail.base.js';

const isMailPriority = (value: string): value is MailPriority => {
  return ['low', 'normal', 'high'].includes(value);
};

class MailService {
  private mailer: IMailer;

  constructor() {
    // Use the noop mailer as default to support operation without mail server
    this.mailer = new NoOpMailer();
  }

  async connect() {
    const factory = new MailFactory();

    try {
      this.mailer = await factory.createMailer();
      logger.info(`Connected to mailer: ${this.mailer.name()}`);
    } catch (error) {
      logger.error(
        'Unable to connect to email server. Make sure you have configured the mailer',
      );
      logger.error(error);
    }
  }

  async close() {
    await this.mailer.close();
  }

  private async sendMailBase(data: Omit<BuiltMail, 'from'>) {
    // TODO Use Mailbase instead of built mail
    const from = {
      name: config.appName,
      address: config.email.from,
    };

    // Send email via mailer
    await mailQueue.add('send', {
      from,
      to: data.to,
      replyTo: data.replyTo ?? config.email.replyTo,
      priority: data.priority ?? 'normal',
      subject: data.subject,
      html: data.html,
      attachments: data.attachments,
    });
  }

  public async sendMail(mailable: MailBase<unknown>): Promise<void> {
    const data = await mailable.build();

    await this.mailer.sendMail(data);
  }

  // TODO Refactor
  async sendMessage(message: Message, email: string): Promise<void> {
    const html = await renderer.renderContent({
      envelope: {
        subject: message.subject,
        to: email,
      },
      body: message.body,
      footer: '', // TODO
    });

    // Send email via mailer
    await this.sendMailBase({
      to: email,
      replyTo: message.replyTo ?? config.email.replyTo,
      priority: isMailPriority(message.priority) ? message.priority : 'normal',
      subject: message.subject,
      html,
      attachments: [],
    });
  }

  // TODO Refactor
  async sendMessages(message: Message, emails: string[]): Promise<void> {
    if (emails.length === 0) {
      logger.warn('Failed to send email. No recipient defined.');
      return;
    }

    const results = await Promise.allSettled(
      emails.map((recipient) => this.sendMessage(message, recipient)),
    );

    // Log errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.warn(
          `Failed to send message to ${emails[index]}:`,
          result.reason,
        );
      }
    });
  }
}

export default new MailService();
