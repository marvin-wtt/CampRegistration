import type { Event, Registration } from '#generated/prisma/client.js';
import type { RegistrationMessageContext } from '@camp-registration/common/entities';
import {
  countryName,
  formatMoney,
  fromMinorUnits,
  translate,
} from '@camp-registration/common/utils';
import { eventContactFor, translateEventContext } from '#app/event/event.util';
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
import logger from '#core/logger';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { processBounceResults } from '#app/messageDelivery/message-bounce-notifier';
import type { SendMailResult } from '#core/mail/mailer.types';
import { FileService } from '#app/file/file.service';
import { addressLikeToString } from '#core/mail/mail.utils';
import { resolve } from '#core/ioc/container';
import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import type { RegistrationChange } from '../registration.changes.js';
import { insertChangesBlock, redactChangeValues } from './changes.markup.js';
import { renderTemplate, TemplateError } from '#core/mail/templating';
import { renderEmailLinks } from '#core/mail/links';
import config from '#config/index';
import { RegistrationMessage } from './base.mail.js';
import { RegistrationForm } from '../registration.form.js';
import type { RenderableMessage } from './renderable-message.js';
import type {
  RegistrationMessageProps,
  LocalContext,
} from '#views/emails/types';
import { htmlToPreviewText } from '#core/mail/emailPreview';
import { htmlToText } from 'html-to-text';

const NUMERIC_DATE: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const NUMERIC_DATE_TIME: Intl.DateTimeFormatOptions = {
  ...NUMERIC_DATE,
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Event dates and birth dates are UTC carriers of the digits the organizer or
 * participant entered (see `@camp-registration/common/utils`), so they format
 * in UTC. A real instant, like `createdAt`, formats in the event's timezone.
 */
function formatDate(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  timeZone = 'UTC',
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
}

export interface RegistrationTemplatePayload {
  registration: Registration;
  event: Event;
  message: RenderableMessage;
  email: string;
  changes?: RegistrationChange[];
  // Groups this send's per-address deliveries; absent on jobs queued before it.
  batchId?: string;
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
    const eventName = translate(this.payload.event.name, this.locale()) ?? '';

    return {
      name: senderName ? `${eventName} | ${senderName}` : eventName,
      address,
    };
  }

  protected subject(): string | Promise<string> {
    let template = this.payload.message.subject.trim();

    // Templates saved by the rich-text editor are HTML; flatten them first.
    if (template.startsWith('<p>') && template.endsWith('</p>')) {
      template = htmlToText(template, { wordwrap: false });
    }

    // A subject is plain text, so values must not be HTML-escaped.
    const subject = renderTemplate(
      template,
      this.context(this.renderChanges('text')),
      'text',
    );

    // A header can't span lines
    return subject.replace(/\s+/g, ' ').trim();
  }

  protected replyTo(): AddressLike | undefined {
    if (this.payload.message.replyTo) {
      return this.payload.message.replyTo;
    }
    return this.contact().to;
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
  protected renderChanges(_format: 'html' | 'text'): string {
    return '';
  }

  /**
   * What the registration costs, as quoted at submission — like the event's
   * price: a number in major units and the text with its currency. Empty on
   * registrations from before quotes.
   */
  private quotedPrice(event: Event) {
    const { quotedAmount, currency } = this.payload.registration;
    if (quotedAmount === null) {
      return { price: null, priceWithCurrency: null };
    }
    const code = currency ?? event.currency;

    return {
      price: fromMinorUnits(quotedAmount, code),
      priceWithCurrency: formatMoney(quotedAmount, code, this.locale()),
    };
  }

  private mailAnswers?: { data: Record<string, unknown>; role: unknown };

  /**
   * The answers a template may print, as shown in the template's language:
   * special-category ones cleared through the form (docs/privacy.md, 6). Done
   * here, at render time, so the mail shows the snapshot it was queued with. A
   * form that can't be read yields none — never all of them.
   */
  private answers(): { data: Record<string, unknown>; role: unknown } {
    if (this.mailAnswers) {
      return this.mailAnswers;
    }

    const { event, registration } = this.payload;
    try {
      // `freePlaces` only feeds `visibleIf`, which moves no stored answer.
      const form = new RegistrationForm(
        { ...event, freePlaces: 0 },
        registration.group,
        this.contact().locale,
      ).load(registration.data);
      form.withoutSensitiveAnswers();
      // A tag no question carries is missing.
      const tagged: Partial<Record<string, unknown[]>> =
        form.extractEventData('displayValue');

      this.mailAnswers = {
        // Dates like the other dates: in the registration's full locale.
        data: form.displayData(this.locale()),
        role: tagged.role?.[0],
      };
    } catch (error) {
      logger.warn(
        `Registration ${registration.id}: answers left out of the mail, form unreadable: ${describeError(error)}`,
      );
      this.mailAnswers = { data: {}, role: undefined };
    }

    return this.mailAnswers;
  }

  /**
   * Listed field by field, so a new column never becomes printable by
   * accident. Event texts follow the template's language (the group's), dates
   * the registration's full locale.
   */
  private context(changes: string): RegistrationMessageContext {
    const { event, registration } = this.payload;
    const contact = this.contact();
    const eventContext = translateEventContext(event, contact);
    const locale = this.locale();
    const country = (code: string | null) =>
      code ? countryName(code, contact.locale) : null;
    const answers = this.answers();
    const displayedRole =
      typeof answers.role === 'string' && answers.role ? answers.role : null;

    return {
      event: {
        name: eventContext.name,
        organizer: eventContext.organizer,
        contactEmail: eventContext.contactEmail,
        countries: event.countries
          .map((code) => countryName(code, contact.locale))
          .join(', '),
        startAt: formatDate(event.startAt, locale, NUMERIC_DATE_TIME),
        endAt: formatDate(event.endAt, locale, NUMERIC_DATE_TIME),
        minAge: event.minAge,
        maxAge: event.maxAge,
        maxParticipants: eventContext.maxParticipants,
        location: eventContext.location,
        price: eventContext.price,
        priceWithCurrency: eventContext.priceWithCurrency,
      },
      registration: {
        id: registration.id,
        data: answers.data,
        computedData: {
          firstName: registration.firstName,
          lastName: registration.lastName,
          dateOfBirth: registration.dateOfBirth
            ? formatDate(registration.dateOfBirth, locale, NUMERIC_DATE)
            : null,
          gender: registration.gender,
          address: {
            street: registration.street,
            city: registration.city,
            zipCode: registration.zipCode,
            country: country(registration.country),
          },
          // By the choice's label; the stored value without a role question.
          role: displayedRole ?? registration.role,
          emails: registration.emails ?? [],
          phoneNumbers: registration.phoneNumbers ?? [],
        },
        customData: registration.customData ?? {},
        changes,
        status: registration.status,
        ...this.quotedPrice(event),
        // For the transfer description; organizers add their bank details.
        reference: registration.paymentReference,
        locale: registration.locale,
        group: country(registration.group),
        createdAt: formatDate(
          registration.createdAt,
          locale,
          NUMERIC_DATE_TIME,
          event.timezone,
        ),
        updatedAt: formatDate(
          registration.updatedAt ?? registration.createdAt,
          locale,
          NUMERIC_DATE_TIME,
          event.timezone,
        ),
      },
    };
  }

  protected attachments(): Promise<MailAttachment[]> {
    return resolve(FileService).getMailAttachments(
      this.payload.message.attachments,
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
          batchId: this.payload.batchId,
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

  // The template is the registration's group's, so the event's texts placed
  // into it follow the language of the group's country. The mail's own chrome (footer,
  // sender name) stays in the participant's language.
  private contact() {
    return eventContactFor(this.payload.event, this.payload.registration);
  }

  private renderBody(): string {
    const template = this.payload.message.body;

    // The list is our markup, so like buttons it goes in after sanitizing. The
    // placeholder is random, so an answer can't fake one. No list, no
    // placeholder: `{{#if registration.changes}}` must stay false.
    const list = this.renderChanges('html');
    const placeholder = list ? `changes-${ulid()}` : '';
    const html = renderTemplate(template, this.context(placeholder), 'html');
    const body = renderEmailLinks(html, { buttonColor: config.primaryColor });

    return placeholder ? insertChangesBlock(body, placeholder, list) : body;
  }

  /** Subject and body as this recipient would get them, without sending. */
  async preview(): Promise<{ subject: string; body: string }> {
    try {
      return {
        subject: await this.subject(),
        body: this.renderBody(),
      };
    } catch (error) {
      // A placeholder typo is the manager's to fix, not a server fault.
      if (error instanceof TemplateError) {
        throw new ApiError(httpStatus.BAD_REQUEST, error.message);
      }
      throw error;
    }
  }

  protected content(): Content | Promise<Content> {
    const body = this.renderBody();
    // The hidden preheader is flattened to plain text here, before `build()`
    // redacts the mail's HTML for the durable copy — by then there is no
    // `change-value` span left for that redaction to strip. Redact first so a
    // changed value can never survive into the preview text either.
    const preview = htmlToPreviewText(redactChangeValues(body));

    return {
      template: 'registration-message',
      context: {
        preview,
        body,
        eventName: translate(this.payload.event.name, this.locale()) ?? '',
        reason: this.reason(),
        // Art. 13 information has to stay reachable after submission, and the
        // message body is manager-authored — so the link belongs in the footer
        // we control, not in a template they may delete.
        privacyUrl: generateUrl(['events', this.payload.event.id, 'privacy']),
        privacyLabel: this.getTg()('registration:email.privacyLink'),
      } satisfies LocalContext<RegistrationMessageProps>,
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

    const batchId = ulid();

    return emails.map((email) => ({
      event,
      registration,
      message,
      email,
      changes,
      batchId,
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
