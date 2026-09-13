import type { Event, Registration } from '#generated/prisma/client.js';
import { translateObject } from '#utils/translateObject';
import { translateEventContext } from '#app/event/event.util';
import type {
  Address,
  AddressLike,
  BuiltMail,
  Content,
  MailAttachment,
  MailPriority,
} from '#core/mail/mail.types';
import { generateUrl } from '#utils/url';
import { ulid } from '#utils/ulid';
import { describeError } from '#utils/errors';
import Handlebars from 'handlebars';
import logger from '#core/logger';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { processBounceResults } from '#app/messageDelivery/message-bounce-notifier';
import type { SendMailResult } from '#core/mail/mailer.types';
import { FileService } from '#app/file/file.service';
import { addressLikeToString } from '#core/mail/mail.utils';
import { resolve } from '#core/ioc/container';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import type { RegistrationChange } from '../registration.changes.js';
import {
  redactChangeValues,
  unwrapChangesBlock,
} from '../registration.changes.js';
import { RegistrationMessage } from './base.mail.js';
import type { RenderableMessage } from './renderable-message.js';

function dateToString(date: Date | string | null): string | null {
  if (date === null) {
    return date;
  }
  return typeof date === 'string' ? date : date.toISOString();
}

/**
 * Only ever called with `event.startAt`/`endAt` — a UTC-carrier `Date`
 * (see `@camp-registration/common/utils`), never a real instant. Rendered
 * server-side with no viewer to cancel out a conversion, so `timeZone: 'UTC'`
 * is required to reproduce the organizer's literal digits regardless of the
 * server's own configured timezone.
 */
function formatEventDate(
  date: Date | string | null,
  locale: string,
): string | null {
  if (date === null) {
    return null;
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(d);
}

export interface RegistrationTemplatePayload {
  registration: Registration;
  event: Event;
  message: RenderableMessage;
  email: string;
  changes?: RegistrationChange[];
}

export class RegistrationTemplateMessage extends RegistrationMessage<RegistrationTemplatePayload> {
  static readonly type: string = 'registration:template:simple';

  private generatedMessageIdToken?: string;

  // Generated here, not by the mailer, so `build()` can persist the same
  // value on the MessageDelivery row and reuse it as the DSN ENVID.
  protected messageIdToken(): string {
    this.generatedMessageIdToken ??= ulid();

    return this.generatedMessageIdToken;
  }

  protected requestDsn(): boolean {
    return true;
  }

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
   * The `registration.changes` token. Only the "updated" trigger has a
   * previous version to diff, so elsewhere the token renders to nothing
   * rather than breaking the mail.
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
        ...translateEventContext(event, locale),
        // Format dates using the registration's full locale
        startAt: formatEventDate(event.startAt, this.locale()),
        endAt: formatEventDate(event.endAt, this.locale()),
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
          bounceCorrelationId: mail.messageId,
        },
      );
    } catch (err) {
      // Bookkeeping, not a precondition for sending.
      logger.warn(
        `Failed to record message delivery for registration ${this.payload.registration.id} (message ${message.id}): ${describeError(err)}`,
      );
    }

    return mail;
  }

  async afterSend(result: SendMailResult): Promise<void> {
    if (!result.rejected.includes(this.payload.email)) {
      return;
    }

    // Defensive: messageIdToken() always returns a value here.
    const messageId = this.messageId();
    if (!messageId) {
      return;
    }

    // Same shape and handling as an async DSN report, so reuse the exact
    // function the bounce-mailbox job feeds.
    await processBounceResults([
      { correlationId: messageId, action: 'failed' },
    ]);
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
