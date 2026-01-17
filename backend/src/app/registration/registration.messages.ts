import type { Camp, MessageTemplate, Registration, File } from '@prisma/client';
import { objectValueOrAll, translateObject } from '#utils/translateObject';
import { MailBase } from '#app/mail/mail.base';
import type {
  AddressLike,
  BuiltMail,
  Content,
  MailAttachment,
} from '#app/mail/mail.types';
import { generateUrl } from '#utils/url';
import { uniqueLowerCase } from '#utils/string';
import Handlebars from 'handlebars';
import { RegistrationResource } from '#app/registration/registration.resource';
import messageTemplateService from '#app/messageTemplate/message-template.service';
import logger from '#core/logger';
import messageService from '#app/message/message.service';
import { addressLikeToString } from '#app/mail/mail.utils';

abstract class RegistrationMessage<
  T extends { registration: Registration },
> extends MailBase<T> {
  protected to(): AddressLike {
    const emails = this.payload.registration.emails;
    if (emails == null || emails.length === 0) {
      throw new Error('Registration has no email address');
    }

    if (emails.length > 1) {
      return emails;
    }

    const address = emails[0];
    const firstName = this.payload.registration.firstName;
    const lastName = this.payload.registration.lastName;

    const name =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : (lastName ?? firstName);

    if (name == null) {
      return address;
    }

    return {
      name,
      address,
    };
  }

  protected locale(): string {
    return this.payload.registration.locale;
  }
}

export class RegistrationNotifyMessage extends RegistrationMessage<{
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
    const locale = this.locale();
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

export interface RegistrationTemplatePayload {
  registration: Registration;
  camp: Camp;
  messageTemplate: MessageTemplateWithFiles;
}

// NOTE: DO NOT CALL THIS DIRECTLY! It has no type
class RegistrationTemplateMessage extends RegistrationMessage<RegistrationTemplatePayload> {
  static readonly type: string;

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

  private context(): object {
    return {
      camp: {
        ...this.payload.camp,
        // Translate values
        name: translateObject(this.payload.camp.name, this.locale()),
        organizer: translateObject(this.payload.camp.organizer, this.locale()),
        contactEmail: translateObject(
          this.payload.camp.contactEmail,
          this.locale(),
        ),
        maxParticipants: translateObject(
          this.payload.camp.maxParticipants,
          this.locale(),
        ),
        location: translateObject(this.payload.camp.location, this.locale()),
      },
      registration: new RegistrationResource(
        this.payload.registration,
      ).transform(),
    };
  }

  async build(): Promise<BuiltMail> {
    const mail = await super.build();

    // TODO Store to address as well

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
}

export class SimpleRegistrationTemplateMessage extends RegistrationTemplateMessage {
  static readonly type = 'registration:template:simple';
}

type MessageTemplateWithFiles = MessageTemplate & { attachments: File[] };

async function loadMessageTemplate(
  campId: string,
  event: string,
): Promise<MessageTemplateWithFiles | null> {
  try {
    return await messageTemplateService.getMessageTemplateByName(event, campId);
  } catch (error) {
    logger.error(error);
    return null;
  }
}

abstract class RegistrationEventMessage extends RegistrationTemplateMessage {
  static readonly event: string;
  static readonly type: string;

  static async enqueueFor(
    this: typeof RegistrationTemplateMessage & { event: string },
    camp: Camp,
    registration: Registration,
  ): Promise<void> {
    const messageTemplate = await loadMessageTemplate(camp.id, this.event);
    if (!messageTemplate) {
      return;
    }

    await this.enqueue({
      registration,
      camp,
      messageTemplate,
    });
  }

  static async sendFor(
    this: typeof RegistrationTemplateMessage & { event: string },
    camp: Camp,
    registration: Registration,
  ): Promise<void> {
    const messageTemplate = await loadMessageTemplate(camp.id, this.event);
    if (!messageTemplate) {
      return;
    }

    return this.send({
      registration,
      camp,
      messageTemplate,
    });
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
  static readonly event = 'registration_accepted';
  static readonly type = 'registration:template:accepted';
}
