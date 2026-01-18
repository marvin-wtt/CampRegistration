import type { Camp, File, MessageTemplate, Registration } from '@prisma/client';
import { objectValueOrAll, translateObject } from '#utils/translateObject';
import { type MailableCtor, MailBase } from '#app/mail/mail.base';
import type {
  AddressLike,
  BuiltMail,
  Content,
  MailAttachment,
  MailPriority,
} from '#app/mail/mail.types';
import { generateUrl } from '#utils/url';
import { uniqueLowerCase } from '#utils/string';
import Handlebars from 'handlebars';
import { RegistrationResource } from '#app/registration/registration.resource';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import logger from '#core/logger';
import { MessageService } from '#app/message/message.service';
import { addressLikeToString } from '#app/mail/mail.utils';
import { resolve } from '#core/ioc/container';

abstract class RegistrationMessage<
  T extends {
    registration: Registration;
    email: string;
  },
> extends MailBase<T> {
  protected to(): AddressLike {
    return this.payload.email;
  }

  protected locale(): string {
    return this.payload.registration.locale;
  }

  static async enqueueMany<P>(
    this: MailableCtor<P>,
    payloads: Iterable<P> | Promise<Iterable<P>>,
  ): Promise<void> {
    await Promise.all(Array.from(await payloads).map((p) => this.enqueue(p)));
  }

  static async sendMany<P>(
    this: MailableCtor<P>,
    payloads: Iterable<P> | Promise<Iterable<P>>,
  ): Promise<void> {
    await Promise.all(Array.from(await payloads).map((p) => this.send(p)));
  }
}

export class RegistrationNotifyMessage extends MailBase<{
  camp: Camp;
  registration: Registration;
}> {
  static readonly type = 'registration:notify';

  protected getTranslationOptions() {
    return {
      namespace: 'registration',
      keyPrefix: 'email.managerNotification',
    };
  }

  protected to(): AddressLike {
    const country = this.payload.registration.country;
    const camp = this.payload.camp;

    return objectValueOrAll(camp.contactEmail, country ?? 'unknown');
  }

  protected replyTo(): AddressLike | undefined {
    return uniqueLowerCase(this.payload.registration.emails ?? []);
  }

  protected subject(): string {
    const t = this.getT();
    const camp = this.createCampContext();

    return t('subject', { camp });
  }

  protected content(): Content {
    const camp = this.payload.camp;
    const registration = this.payload.registration;
    // TODO Use handlebars helper instead of generating url manually
    const url = generateUrl(['management', camp.id]);

    return {
      template: 'registration-manager-notification',
      context: {
        camp: this.createCampContext(),
        registration: {
          ...registration,
          url,
        },
      },
    };
  }

  private createCampContext() {
    const locale = this.payload.registration.country ?? this.locale();
    const camp = this.payload.camp;

    return {
      ...camp,
      // Translate values
      name: translateObject(camp.name, locale),
      organizer: translateObject(camp.organizer, locale),
      contactEmail: translateObject(camp.contactEmail, locale),
      maxParticipants: translateObject(camp.maxParticipants, locale),
      location: translateObject(camp.location, locale),
    };
  }

  protected attachments(): MailAttachment[] {
    return [
      {
        filename: 'data.json',
        contentType: 'application/json',
        content: JSON.stringify(this.payload.registration),
      },
    ];
  }
}

interface RegistrationTemplatePayload {
  registration: Registration;
  camp: Camp;
  messageTemplate: MessageTemplateWithFiles;
  email: string;
}

export class RegistrationTemplateMessage extends RegistrationMessage<{
  registration: Registration;
  camp: Camp;
  messageTemplate: MessageTemplateWithFiles;
  email: string;
}> {
  static readonly type: string = 'registration:template:simple';

  protected subject(): string | Promise<string> {
    let template = translateObject(
      this.payload.messageTemplate.subject,
      this.locale(),
    );

    template = template.trim();

    // Remove paragraph tags if they are present
    if (template.startsWith('<p>') && template.endsWith('</p>')) {
      template = template.slice(3, -4).trim();
    }

    const compile = Handlebars.compile(template, {
      knownHelpersOnly: true,
      knownHelpers: {
        if: true,
        unless: true,
        each: true,
        with: true,
      },
      noEscape: true, // No escape needed for subjects
    });

    return compile(this.context());
  }

  protected replyTo(): AddressLike | undefined {
    return translateObject(
      this.payload.camp.contactEmail,
      this.payload.registration.country ?? '',
    );
  }

  protected priority(): MailPriority {
    const priority = this.payload.messageTemplate.priority;
    if (priority === 'low' || priority === 'normal' || priority === 'high') {
      return priority;
    }

    return super.priority();
  }

  private context(): object {
    const locale = this.payload.registration.country ?? this.locale();
    const camp = this.payload.camp;

    return {
      camp: {
        ...camp,
        // Translate values
        name: translateObject(camp.name, locale),
        organizer: translateObject(camp.organizer, locale),
        contactEmail: translateObject(camp.contactEmail, locale),
        maxParticipants: translateObject(camp.maxParticipants, locale),
        location: translateObject(camp.location, locale),
      },
      registration: new RegistrationResource(
        this.payload.registration,
      ).transform(),
    };
  }

  async build(): Promise<BuiltMail> {
    const mail = await super.build();

    const messageService = resolve(MessageService);
    await messageService.createMessage(
      this.payload.registration,
      this.payload.messageTemplate,
      {
        subject: mail.subject,
        body: mail.html ?? mail.text ?? '',
        priority: mail.priority,
        to: mail.to ? addressLikeToString(mail.to) : undefined,
        cc: mail.cc ? addressLikeToString(mail.cc) : undefined,
        bcc: mail.bcc ? addressLikeToString(mail.bcc) : undefined,
        replyTo: mail.replyTo ? addressLikeToString(mail.replyTo) : undefined,
      },
    );

    return mail;
  }

  protected content(): Content | Promise<Content> {
    const template = translateObject(
      this.payload.messageTemplate.body,
      this.locale(),
    );

    const compile = Handlebars.compile(template, {
      knownHelpersOnly: true,
      knownHelpers: {
        if: true,
        unless: true,
        each: true,
        with: true,
      },
    });

    return {
      html: compile(this.context()),
    };
  }

  static prepareForRegistration(
    camp: Camp,
    registration: Registration,
    messageTemplate: MessageTemplateWithFiles,
  ): RegistrationTemplatePayload[] | null {
    const emails = registration.emails;
    if (!emails?.length) {
      logger.warn(`Registration ${registration.id} has no emails defined.`);
      return null;
    }

    return emails.map((email) => ({
      camp,
      registration,
      messageTemplate,
      email,
    }));
  }

  static async enqueueFor(
    this: typeof RegistrationTemplateMessage,
    camp: Camp,
    registration: Registration,
    messageTemplate: MessageTemplateWithFiles,
  ): Promise<void> {
    const payloads = this.prepareForRegistration(
      camp,
      registration,
      messageTemplate,
    );
    if (!payloads) {
      return;
    }

    await this.enqueueMany(payloads);
  }

  static async sendFor(
    this: typeof RegistrationTemplateMessage,
    camp: Camp,
    registration: Registration,
    messageTemplate: MessageTemplateWithFiles,
  ): Promise<void> {
    const payloads = this.prepareForRegistration(
      camp,
      registration,
      messageTemplate,
    );
    if (!payloads) return;

    await this.sendMany(payloads);
  }
}

type MessageTemplateWithFiles = MessageTemplate & { attachments: File[] };

async function loadMessageTemplate(
  campId: string,
  event: string,
): Promise<MessageTemplateWithFiles | null> {
  try {
    const messageTemplateService = resolve(MessageTemplateService);
    return await messageTemplateService.getMessageTemplateByName(event, campId);
  } catch (error) {
    logger.error(error);
    return null;
  }
}

class RegistrationEventMessage extends RegistrationTemplateMessage {
  static readonly event: string;
  static readonly type: string;

  static async enqueueFor(
    this: typeof RegistrationEventMessage,
    camp: Camp,
    registration: Registration,
  ): Promise<void> {
    const messageTemplate = await loadMessageTemplate(camp.id, this.event);
    if (!messageTemplate) {
      logger.debug(
        `No message template for event ${this.event} and camp ${camp.id}`,
      );
      return;
    }

    const payload = this.prepareForRegistration(
      camp,
      registration,
      messageTemplate,
    );

    if (!payload) {
      return;
    }

    await this.enqueueMany(payload);
  }

  static async sendFor(
    this: typeof RegistrationEventMessage,
    camp: Camp,
    registration: Registration,
  ): Promise<void> {
    const messageTemplate = await loadMessageTemplate(camp.id, this.event);
    if (!messageTemplate) {
      return;
    }

    const payload = this.prepareForRegistration(
      camp,
      registration,
      messageTemplate,
    );

    if (!payload) {
      return;
    }

    await this.sendMany(payload);
  }
}

export class RegistrationConfirmedMessage extends RegistrationEventMessage {
  static readonly event = 'registration_confirmed';
  static readonly type = 'registration:template:confirmed';

  protected attachments(): MailAttachment[] | Promise<MailAttachment[]> {
    return [
      // Attach registration data PDF here
    ];
  }
}

export class RegistrationWaitlistedMessage extends RegistrationEventMessage {
  static readonly event = 'registration_waitlisted';
  static readonly type = 'registration:template:waitlisted';
}

export class RegistrationUpdatedMessage extends RegistrationEventMessage {
  static readonly event = 'registration_updated';
  static readonly type = 'registration:template:updated';

  protected attachments(): MailAttachment[] | Promise<MailAttachment[]> {
    return [
      // Attach registration data PDF here
    ];
  }
}

export class RegistrationDeletedMessage extends RegistrationEventMessage {
  static readonly event = 'registration_canceled';
  static readonly type = 'registration:template:canceled';
}

export class RegistrationAcceptedMessage extends RegistrationEventMessage {
  static readonly event = 'registration_waitlist_accepted';
  static readonly type = 'registration:template:accepted';
}
