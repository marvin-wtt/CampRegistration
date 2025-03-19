import type { Message } from '@prisma/client';
import config from '#config/index.js';
import renderer from '#core/mail/mail.renderer.js';
import { MailFactory } from '#core/mail/mail.factory.js';
import logger from '#core/logger.js';
import { NoOpMailer } from '#core/mail/noop.mailer.js';
import type {
  AdvancedMailPayload,
  IMailer,
  MailPayload,
  MailPriority,
  TemplateMailData,
} from '#core/mail/mail.types';

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
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the mailer',
      );
      logger.warn(error);
    }
  }

  async sendTemplateMail(data: TemplateMailData): Promise<void> {
    // TODO Add email to context
    // Render content into global template
    const html = await renderer.renderFile({
      subject: data.subject,
      fileName: data.template,
      context: {
        ...data.context,
        email: data.to,
      },
    });

    // Send email via mailer
    await this.sendMailBase({
      to: data.to,
      replyTo: data.replyTo,
      priority: data.priority,
      subject: data.subject,
      body: html,
      attachments: data.attachments,
    });
  }

  async sendMail(data: MailPayload) {
    // TODO Add email to context
    // Render content into global template
    const html = await renderer.renderContent({
      subject: data.subject,
      preview: '', // TODO
      body: data.body,
      footer: '', // TODO
    });

    // Send email via mailer
    await this.sendMailBase({
      to: data.to,
      replyTo: data.replyTo,
      priority: data.priority,
      subject: data.subject,
      body: html,
      attachments: data.attachments,
    });
  }

  private async sendMailBase(data: Omit<AdvancedMailPayload, 'from'>) {
    const from = {
      name: config.appName,
      address: config.email.from,
    };

    // Send email via mailer
    await this.mailer.sendMail({
      from,
      to: data.to,
      replyTo: data.replyTo ?? config.email.replyTo,
      priority: data.priority ?? 'normal',
      subject: data.subject,
      body: data.body,
      attachments: data.attachments,
    });
  }

  async sendMessage(message: Message, email: string): Promise<void> {
    await this.sendMail({
      to: email,
      replyTo: message.replyTo ?? config.email.replyTo,
      priority: isMailPriority(message.priority) ? message.priority : 'normal',
      subject: message.subject,
      body: message.body,
    });
  }

  async sendMessages(message: Message, emails: string[]): Promise<void> {
    if (emails.length === 0) {
      throw new Error('Failed to send email. No recipient defined.');
    }

    const results = await Promise.allSettled(
      emails.map((recipient) => this.sendMessage(message, recipient)),
    );

    // Log errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(
          `Failed to send message to ${emails[index]}:`,
          result.reason,
        );
      }
    });
  }
}

export default new MailService();
