import type { Registration } from '#generated/prisma/client.js';
import { type MailableCtor, MailBase } from '#core/mail/mail.base';
import type { AddressLike } from '#core/mail/mail.types';

/**
 * Shared by every mailable sent about a single registration to one of its
 * emails (`RegistrationTemplateMessage` in template.mail.ts and its
 * trigger-based subclasses, one file per trigger, extending
 * `RegistrationEventMessage` in event.mail.ts). `RegistrationNotifyMessage`
 * (notify.mail.ts) targets the event's contact address instead, so it
 * extends `MailBase` directly rather than this class.
 */
export abstract class RegistrationMessage<
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
