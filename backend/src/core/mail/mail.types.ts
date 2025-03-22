export type MailAddress = string | { name: string; address: string };

export type MailPriority = 'low' | 'normal' | 'high';

export interface MailPayload {
  to: MailAddress | MailAddress[];
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
  sendMail(payload: AdvancedMailPayload): Promise<void> | void;

  isAvailable(): Promise<boolean> | boolean;

  name(): string;
}
