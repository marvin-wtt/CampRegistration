import { MailBase } from '#app/mail/mail.base';
import type { JobOptions } from '#core/queue/Queue';
import type { MailAttachment, MailPriority } from '#app/mail/mail.types';
import { generateApiUrl, generateUrl } from '#utils/url';
import { resolve } from '#core/ioc/container';
import { FileService } from '#app/file/file.service';
import type { StorageFile } from '#core/storage/storage';

export interface NewsletterMailPayload {
  to: string;
  name: string | null;
  subject: string;
  body: string;
  replyTo?: string;
  newsletterId: string;
  unsubscribeToken: string;
  attachments?: StorageFile[];
}

export class NewsletterMessageMail extends MailBase<NewsletterMailPayload> {
  static readonly type = 'newsletter:send';

  static jobOptions(): JobOptions {
    return { priority: 10 };
  }

  protected priority(): MailPriority {
    return 'low';
  }

  protected replyTo(): string | undefined {
    return this.payload.replyTo;
  }

  protected to() {
    const { to, name } = this.payload;

    if (name) {
      return { name, address: to };
    }

    return to;
  }

  protected subject(): string {
    return this.payload.subject;
  }

  private getUnsubscribeUrl(): string {
    return generateUrl(
      `newsletters/unsubscribe/${this.payload.unsubscribeToken}`,
    );
  }

  private getOneClickUnsubscribeUrl(): string {
    return generateApiUrl(
      `newsletters/unsubscribe/${this.payload.unsubscribeToken}`,
    );
  }

  protected headers(): Record<string, string> {
    return {
      'List-Unsubscribe': `<${this.getOneClickUnsubscribeUrl()}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  protected getTranslationOptions() {
    return {
      namespace: 'newsletter',
      keyPrefix: 'email',
    };
  }

  protected async attachments(): Promise<MailAttachment[]> {
    const files = this.payload.attachments ?? [];
    if (!files.length) {
      return [];
    }

    const fileService = resolve(FileService);

    return Promise.all(
      files.map(async (file) => ({
        filename: file.originalName,
        content: await fileService.getFileStream(file),
        contentType: file.type,
      })),
    );
  }

  protected content() {
    return {
      template: 'newsletter',
      context: {
        body: this.payload.body,
        unsubscribeUrl: this.getUnsubscribeUrl(),
      },
    };
  }
}
