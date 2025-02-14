import type { Message } from '@prisma/client';
import { NodeMailer } from '#app/mail/node.mailer.js';
import config from '#config/index';
import renderer from '#core/renderer/index.js';

type MailAddress = string | { name: string; address: string };

type MailPriority = 'low' | 'normal' | 'high';

export interface MailPayload {
  to: MailAddress;
  replyTo?: MailAddress | MailAddress[] | undefined;
  priority?: MailPriority | undefined;
  subject: string;
  body: string; // The compiled text/HTML
  attachments?: { filename: string; content: Buffer | string }[] | undefined;
}

export interface TemplateMailData extends Omit<MailPayload, 'body'> {
  template: string;
  context: Record<string, unknown>;
}

export interface AdvancedMailPayload extends MailPayload {
  from: MailAddress;
  inReplyTo?: MailAddress | undefined;
  references?: string | string[] | undefined;
  messageId?: string | undefined;
}

export interface IMailer {
  sendEmail(payload: AdvancedMailPayload): Promise<void>;

  isAvailable(): Promise<boolean>;

  name(): string;
}

const isMailPriority = (value: string): value is MailPriority => {
  return ['low', 'normal', 'high'].includes(value);
};

class MailService {
  private mailer: IMailer;

  constructor() {
    // TODO Load mailer form config
    this.mailer = new NodeMailer();
  }

  async sendTemplateMail(data: TemplateMailData): Promise<void> {
    // TODO Add email to context
    // Render content into global template
    const html = await renderer.renderFile({
      subject: data.subject,
      fileName: data.template,
      context: data.context,
    });

    // Send email via mailer
    await this.sendMailBase({
      to: data.to,
      replyTo: data.replyTo,
      priority: data.priority,
      subject: data.subject,
      body: html,
      attachments: undefined, // TODO
    });
  }

  async sendMail(data: MailPayload) {
    // TODO Add email to context
    // Render content into global template
    const html = await renderer.renderContent({
      subject: data.subject,
      preview: '', // TODO
      main: data.body,
      footer: '', // TODO
    });

    // Send email via mailer
    await this.sendMailBase({
      to: data.to,
      replyTo: data.replyTo,
      priority: data.priority,
      subject: data.subject,
      body: html,
      attachments: undefined, // TODO
    });
  }

  private async sendMailBase(data: Omit<AdvancedMailPayload, 'from'>) {
    const from = {
      name: config.appName,
      address: config.email.from,
    };

    // Send email via mailer
    await this.mailer.sendEmail({
      from,
      to: data.to,
      replyTo: data.replyTo ?? config.email.replyTo,
      priority: data.priority ?? 'normal',
      subject: data.subject,
      body: data.body,
      attachments: undefined, // TODO
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
    await Promise.allSettled(
      emails.map(async (recipient) => {
        return this.sendMessage(message, recipient);
      }),
    );
  }
}

export default new MailService();
