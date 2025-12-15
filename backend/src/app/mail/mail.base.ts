import type {
  BuiltMail,
  Content,
  Envelope,
  MailAttachment,
  AddressLike,
  Translator,
  TranslationOptions,
  MailPriority,
  Address,
} from './mail.types.js';
import config from '#config/index';
import i18n from '#core/i18n';
import { MailRenderer } from '#app/mail/mail.renderer.js';
import mailService from '#app/mail/mail.service.js';

export interface MailableCtor<P> {
  new (payload: P): MailBase<P>;
  readonly type: string;
}

// TODO Use real types for queue and mailer
export interface EmailJob<P = unknown> {
  mailable: string; // internal type name
  payload: P; // JSON-serializable payload
}

export interface EmailQueue {
  add(job: EmailJob<any>): Promise<void>;
}

export interface Mailer {
  send(mail: BuiltMail): Promise<void>;
}

const mailQueue: EmailQueue = undefined as unknown as EmailQueue;

export abstract class MailBase<P> {
  private t?: Translator;

  constructor(protected readonly payload: P) {}

  protected getTranslationOptions(): TranslationOptions {
    return {};
  }

  protected locale(): string | undefined {
    return undefined;
  }

  public getT(): Translator {
    if (!this.t) {
      const { namespace, keyPrefix } = this.getTranslationOptions();
      const locale = this.locale() ?? i18n.language;

      this.t = i18n.getFixedT(locale, namespace, keyPrefix);
    }
    return this.t;
  }

  protected abstract to(): AddressLike; // required
  protected abstract subject(): string | Promise<string>; // required

  protected from(): Address | undefined {
    return {
      name: config.appName,
      address: config.email.from,
    };
  }

  protected replyTo(): AddressLike | undefined {
    return config.email.replyTo;
  }

  protected cc(): AddressLike | undefined {
    return undefined;
  }

  protected bcc(): AddressLike | undefined {
    return undefined;
  }

  protected headers(): Record<string, string> | undefined {
    return undefined;
  }

  protected priority(): MailPriority {
    return 'normal';
  }

  protected async envelope(): Promise<Envelope> {
    const [to, from, replyTo, cc, bcc, subject, priority, headers] =
      await Promise.all([
        Promise.resolve(this.to()),
        Promise.resolve(this.from()),
        Promise.resolve(this.replyTo()),
        Promise.resolve(this.cc()),
        Promise.resolve(this.bcc()),
        Promise.resolve(this.subject()),
        Promise.resolve(this.priority()),
        Promise.resolve(this.headers()),
      ]);

    return {
      to,
      subject,
      from,
      replyTo,
      cc,
      bcc,
      priority,
      headers,
    };
  }

  protected abstract content(): Content | Promise<Content>;

  private async render(
    envelope: Envelope,
    content: Content,
  ): Promise<string | undefined> {
    const renderer = new MailRenderer(this.t);

    if ('html' in content) {
      return renderer.renderContent({
        body: content.html,
        envelope,
        footer: '', // TODO Where should this come from?
      });
    }

    if ('template' in content) {
      return renderer.renderFile({
        template: content.template,
        context: content.context,
        envelope,
      });
    }

    return undefined;
  }

  protected attachments(): MailAttachment[] | Promise<MailAttachment[]> {
    return [];
  }

  public async build(): Promise<BuiltMail> {
    const [envelop, content, attachments] = await Promise.all([
      Promise.resolve(this.envelope()),
      Promise.resolve(this.content()),
      Promise.resolve(this.attachments()),
    ]);

    const html = await this.render(envelop, content);

    return {
      ...envelop,
      html,
      text: content.text,
      attachments: attachments.length ? attachments : undefined,
    };
  }

  // TODO Add soft error handling
  static async enqueue<P>(
    this: MailableCtor<P> & { type: string },
    payload: P,
  ): Promise<void> {
    const job: EmailJob<P> = {
      mailable: this.type,
      payload,
    };

    await mailQueue.add(job);
  }

  // TODO Add soft error handling
  static async sendNow<P>(
    this: MailableCtor<P> & { type: string },
    payload: P,
  ): Promise<void> {
    const mailable = new this(payload);
    const data = await mailable.build();

    await mailService.sendMail(data);
  }
}
