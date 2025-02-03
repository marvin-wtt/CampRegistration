import type { Message, MessageReceipient } from '@prisma/client';
import { NodeMailer } from '#app/mail/node.mailer.js';
import config from '#config/index';

type MailAddress = string | { name: string; address: string };

type MailPriority = 'low' | 'normal' | 'high';

export interface MailPayload {
  from: MailAddress;
  to: MailAddress;
  replyTo?: MailAddress | undefined;
  subject: string;
  body: string; // The compiled text/HTML
  priority?: MailPriority | undefined;
  attachments?: { filename: string; content: Buffer | string }[] | undefined;
  inReplyTo?: MailAddress | undefined;
  references?: string | string[] | undefined;
  messageId?: string | undefined;
}

export interface IMailer {
  sendEmail(payload: MailPayload): Promise<void>;
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

  async send(message: Message, recipient: MessageReceipient) {
    // TODO Inject into global mail template

    const from = {
      name: config.appName,
      address: config.email.from,
    };

    await this.mailer.sendEmail({
      from,
      to: recipient.email,
      replyTo: message.replyTo ?? config.email.replyTo,
      priority: isMailPriority(message.priority) ? message.priority : 'normal',
      subject: recipient.subject,
      body: recipient.body,
      attachments: undefined, // TODO
    });
  }

  async sendAll(message: Message, recipients: MessageReceipient[]) {
    return Promise.allSettled(
      recipients.map(async (recipient) => {
        return this.send(message, recipient);
      }),
    );
  }
}

export default new MailService();
