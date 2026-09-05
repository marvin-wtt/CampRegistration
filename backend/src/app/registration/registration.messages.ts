import type {
  Event,
  File,
  Message,
  MessageTemplate,
  Registration,
} from '#generated/prisma/client.js';
import { objectValueOrAll, translateObject } from '#utils/translateObject';
import { type MailableCtor, MailBase } from '#app/mail/mail.base';
import type {
  Address,
  AddressLike,
  BuiltMail,
  Content,
  MailAttachment,
  MailPriority,
} from '#app/mail/mail.types';
import { generateUrl } from '#utils/url';
import { uniqueLowerCase } from '#utils/string';
import Handlebars from 'handlebars';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import logger from '#core/logger';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { FileService } from '#app/file/file.service';
import { addressLikeToString } from '#app/mail/mail.utils';
import { resolve } from '#core/ioc/container';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import {
  type RegistrationChange,
  redactChangeValues,
  renderChangesHtml,
  renderChangesText,
  unwrapChangesBlock,
} from './registration.changes.js';

function dateToString(date: Date | string | null): string | null {
  if (date === null) {
    return date;
  }
  return typeof date === 'string' ? date : date.toISOString();
}

function formatDate(date: Date | string | null, locale: string): string | null {
  if (date === null) {
    return null;
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(d);
}

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

  protected reason(): string {
    // Use global namespace as the keyPrefix might be overwritten by implementation
    return this.getTg()('registration:email.reason');
  }

  static async enqueueMany<P>(
    this: MailableCtor<P>,
    payloads: Iterable<P> | Promise<Iterable<P>>,
  ): Promise<void> {
    await this.enqueueBulk(Array.from(await payloads));
  }

  static async sendMany<P>(
    this: MailableCtor<P>,
    payloads: Iterable<P> | Promise<Iterable<P>>,
  ): Promise<void> {
    await Promise.all(Array.from(await payloads).map((p) => this.send(p)));
  }
}

export class RegistrationNotifyMessage extends MailBase<{
  event: Event;
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
    const event = this.payload.event;

    return objectValueOrAll(event.contactEmail, country ?? 'unknown');
  }

  protected locale(): string {
    // The locale of the contact mail is unknown, so we use the country and
    //  locale of the registration to determine the language of the email.
    return (
      this.payload.registration.country ?? this.payload.registration.locale
    );
  }

  protected replyTo(): AddressLike | undefined {
    return uniqueLowerCase(this.payload.registration.emails ?? []);
  }

  protected subject(): string {
    const t = this.getT();
    const event = this.createEventContext();

    return t('subject', { event });
  }

  protected content(): Content {
    const event = this.payload.event;
    const registration = this.payload.registration;

    const url = generateUrl(
      ['management', 'events', event.id, 'participants'],
      {
        registrationId: registration.id,
      },
    );

    return {
      template: 'registration-manager-notification',
      context: {
        event: this.createEventContext(),
        registration: {
          ...registration,
          url,
        },
      },
    };
  }

  private createEventContext() {
    const locale = this.payload.registration.country ?? this.locale();
    const event = this.payload.event;

    return {
      ...event,
      // Translate values
      name: translateObject(event.name, locale),
      organizer: translateObject(event.organizer, locale),
      contactEmail: translateObject(event.contactEmail, locale),
      maxParticipants: translateObject(event.maxParticipants, locale),
      location: translateObject(event.location, locale),
    };
  }
}

interface RegistrationTemplatePayload {
  registration: Registration;
  event: Event;
  message: RenderableMessage;
  email: string;
  changes?: RegistrationChange[];
}

export class RegistrationTemplateMessage extends RegistrationMessage<RegistrationTemplatePayload> {
  static readonly type: string = 'registration:template:simple';

  protected from(): Address {
    const from = super.from();
    const address = typeof from === 'string' ? from : from?.address;
    if (!address) {
      // This is purely defensive since the base class never returns undefined
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Invalid email from address',
      );
    }
    const senderName = typeof from === 'string' ? undefined : from?.name;
    const eventName = translateObject(this.payload.event.name, this.locale());

    return {
      name: senderName ? `${eventName} | ${senderName}` : eventName,
      address,
    };
  }

  protected subject(): string | Promise<string> {
    let template = translateObject(
      this.payload.message.subject,
      this.payload.registration.country ?? this.locale(),
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
    });

    return compile(this.context('text'));
  }

  protected replyTo(): AddressLike | undefined {
    if (this.payload.message.replyTo) {
      return this.payload.message.replyTo;
    }
    return translateObject(
      this.payload.event.contactEmail,
      this.payload.registration.country ?? '',
    );
  }

  protected priority(): MailPriority {
    const priority = this.payload.message.priority;
    if (priority === 'low' || priority === 'normal' || priority === 'high') {
      return priority;
    }

    return super.priority();
  }

  /**
   * What changed about this registration, for the `registration.changes` token.
   *
   * Only the "updated" event has a previous version to compare against; for
   * every other event the token renders to nothing rather than erroring, so a
   * manager who pastes it into the wrong template gets an empty line, not a
   * broken mail.
   */
  protected renderChanges(
    _format: 'html' | 'text',
  ): Handlebars.SafeString | string {
    return '';
  }

  private context(format: 'html' | 'text'): object {
    const locale = this.payload.registration.country ?? this.locale();
    const event = this.payload.event;

    return {
      event: {
        ...event,
        // Translate values
        name: translateObject(event.name, locale),
        organizer: translateObject(event.organizer, locale),
        contactEmail: translateObject(event.contactEmail, locale),
        maxParticipants: translateObject(event.maxParticipants, locale),
        location: translateObject(event.location, locale),
        // Format dates using the registration's full locale
        startAt: formatDate(event.startAt, this.locale()),
        endAt: formatDate(event.endAt, this.locale()),
      },
      registration: {
        id: this.payload.registration.id,
        status: this.payload.registration.status,
        data: this.payload.registration.data,
        computedData: {
          firstName: this.payload.registration.firstName,
          lastName: this.payload.registration.lastName,
          dateOfBirth: dateToString(
            this.payload.registration.dateOfBirth,
          )?.split('T')[0],
          gender: this.payload.registration.gender,
          address: {
            street: this.payload.registration.street,
            city: this.payload.registration.city,
            zipCode: this.payload.registration.zipCode,
            country: this.payload.registration.country,
          },
          role: this.payload.registration.role,
          emails: this.payload.registration.emails,
        },
        customData: this.payload.registration.customData ?? {},
        changes: this.renderChanges(format),
        locale: this.payload.registration.locale,
        room: null,
        // Use snake case because form keys should be snake case too
        updatedAt: dateToString(this.payload.registration.updatedAt),
        createdAt: dateToString(this.payload.registration.createdAt),
      },
    };
  }

  protected async attachments(): Promise<MailAttachment[]> {
    const files = this.payload.message.attachments;
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

  async build(): Promise<BuiltMail> {
    const mail = await super.build();

    const message = this.payload.message;
    const messageDeliveryService = resolve(MessageDeliveryService);
    try {
      await messageDeliveryService.createDelivery(
        this.payload.registration,
        {
          kind: message.kind,
          id: message.id,
          attachments: message.attachments,
        },
        {
          subject: mail.subject,
          // The mail keeps its values; the durable copy keeps only the labels.
          body: redactChangeValues(mail.html ?? mail.text ?? ''),
          priority: mail.priority,
          to: mail.to ? addressLikeToString(mail.to) : undefined,
          cc: mail.cc ? addressLikeToString(mail.cc) : undefined,
          bcc: mail.bcc ? addressLikeToString(mail.bcc) : undefined,
          replyTo: mail.replyTo ? addressLikeToString(mail.replyTo) : undefined,
        },
      );
    } catch (err) {
      // Recording the delivery is bookkeeping, not a precondition for
      // sending. Never let a failure here (e.g. the Message was deleted
      // in the meantime) block the actual mail send.
      logger.warn(
        `Failed to record message delivery for registration ${this.payload.registration.id} (message ${message.id}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return mail;
  }

  protected content(): Content | Promise<Content> {
    const locale = this.payload.registration.country ?? this.locale();

    const template = translateObject(this.payload.message.body, locale);

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
      template: 'registration-message',
      context: {
        body: unwrapChangesBlock(compile(this.context('html'))),
        eventName: translateObject(this.payload.event.name, locale),
        reason: this.reason(),
        // Art. 13 information has to stay reachable after submission, and the
        // message body is manager-authored — so the link belongs in the footer
        // we control, not in a template they may delete.
        privacyUrl: generateUrl(['events', this.payload.event.id, 'privacy']),
        privacyLabel: this.getTg()('registration:email.privacyLink'),
      },
    };
  }

  protected static prepareForRegistration(
    event: Event,
    registration: Registration,
    message: RenderableMessage,
    changes?: RegistrationChange[],
  ): RegistrationTemplatePayload[] | null {
    const emails = Array.from(new Set(registration.emails));
    if (emails.length === 0) {
      logger.warn(`Registration ${registration.id} has no emails defined.`);
      return null;
    }

    return emails.map((email) => ({
      event,
      registration,
      message,
      email,
      changes,
    }));
  }

  static async enqueueForAll(
    this: typeof RegistrationTemplateMessage,
    event: Event,
    registrations: Registration[],
    message: RenderableMessage,
  ): Promise<void> {
    const payloads = registrations.flatMap(
      (registration) =>
        this.prepareForRegistration(event, registration, message) ?? [],
    );

    await this.enqueueBulk(payloads);
  }
}

type MessageTemplateWithFiles = MessageTemplate & { attachments: File[] };

// The unified shape the render pipeline consumes, satisfied by both an ad-hoc
// Message and an automated MessageTemplate.
export interface RenderableMessage {
  kind: 'message' | 'template';
  id: string;
  subject: string;
  body: string;
  priority: string;
  replyTo: string | null;
  attachments: File[];
}

function templateToRenderable(
  template: MessageTemplateWithFiles,
): RenderableMessage {
  return {
    kind: 'template',
    id: template.id,
    subject: template.subject,
    body: template.body,
    priority: template.priority,
    replyTo: template.replyTo,
    attachments: template.attachments,
  };
}

type MessageWithFiles = Message & { attachments: File[] };

// Adapts an ad-hoc Message into the shared RenderableMessage contract, mirroring
// templateToRenderable so both send paths build the shape in exactly one place.
export function messageToRenderable(
  message: MessageWithFiles,
): RenderableMessage {
  return {
    kind: 'message',
    id: message.id,
    subject: message.subject,
    body: message.body,
    priority: message.priority,
    replyTo: message.replyTo,
    attachments: message.attachments,
  };
}

async function loadMessageTemplate(
  event: Event,
  trigger: string,
  country: string | null | undefined,
): Promise<MessageTemplateWithFiles | null> {
  try {
    const messageTemplateService = resolve(MessageTemplateService);

    // When the event has only one group, we can assume the person is in that group
    if (country === null && event.countries.length === 1) {
      country = event.countries[0];
    }

    return await messageTemplateService.getMessageTemplateByName(
      event.id,
      trigger,
      country,
    );
  } catch (error) {
    logger.error(error);
    return null;
  }
}

class RegistrationEventMessage extends RegistrationTemplateMessage {
  static readonly trigger: string;
  static readonly type: string;

  static async enqueueFor(
    this: typeof RegistrationEventMessage,
    event: Event,
    registration: Registration,
    changes?: RegistrationChange[],
  ): Promise<void> {
    const messageTemplate = await loadMessageTemplate(
      event,
      this.trigger,
      registration.country,
    );
    if (!messageTemplate) {
      logger.debug(
        `No message template for event type ${this.trigger} and event ${event.id}`,
      );
      return;
    }

    const payload = this.prepareForRegistration(
      event,
      registration,
      templateToRenderable(messageTemplate),
      changes,
    );

    if (!payload) {
      return;
    }

    await this.enqueueMany(payload);
  }

  static async sendFor(
    this: typeof RegistrationEventMessage,
    event: Event,
    registration: Registration,
    changes?: RegistrationChange[],
  ): Promise<void> {
    const messageTemplate = await loadMessageTemplate(
      event,
      this.trigger,
      registration.country,
    );
    if (!messageTemplate) {
      return;
    }

    const payload = this.prepareForRegistration(
      event,
      registration,
      templateToRenderable(messageTemplate),
      changes,
    );

    if (!payload) {
      return;
    }

    await this.sendMany(payload);
  }
}

export class RegistrationSubmittedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_submitted';
  static readonly type = 'registration:template:submitted';
}

export class RegistrationConfirmedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_confirmed';
  static readonly type = 'registration:template:confirmed';
}

export class RegistrationWaitlistedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_waitlisted';
  static readonly type = 'registration:template:waitlisted';
}

export class RegistrationUpdatedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_updated';
  static readonly type = 'registration:template:updated';

  protected renderChanges(
    format: 'html' | 'text',
  ): Handlebars.SafeString | string {
    // Absent for a job enqueued before this field existed, and for any caller
    // that supplied none. Nothing to list is not an error worth failing a send
    // over — the participant still learns they were edited.
    const changes = this.payload.changes;
    if (!changes?.length) {
      return '';
    }

    const t = this.getTg();
    const labels = {
      cleared: t('registration:email.changes.cleared'),
      file: t('registration:email.changes.file'),
    };

    if (format === 'text') {
      return renderChangesText(changes, labels);
    }

    // Values are escaped as the markup is built, so the result is safe to emit
    // through a double-stash and must not be escaped a second time.
    return new Handlebars.SafeString(renderChangesHtml(changes, labels));
  }
}

export class RegistrationDeletedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_canceled';
  static readonly type = 'registration:template:canceled';
}

export class RegistrationAcceptedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_waitlist_accepted';
  static readonly type = 'registration:template:accepted';
}
