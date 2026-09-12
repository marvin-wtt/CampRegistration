import type { Registration } from '#generated/prisma/client.js';
import { type MailableCtor, MailBase } from '#core/mail/mail.base';
import type { AddressLike } from '#core/mail/mail.types';

/**
 * Base for mailables addressed to one of a registration's own emails.
 * `RegistrationNotifyMessage` targets the event contact instead, so it
 * extends `MailBase` directly.
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
