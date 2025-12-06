import type { Camp, Registration } from '@prisma/client';
import messageService from '#app/message/message.service';
import { objectValueOrAll, translateObject } from '#utils/translateObject';
import { MailBase } from '#app/mail/mail.base';
import { BaseMessages } from '#core/base/BaseMessages';
import { catchAndResolve } from '#utils/promiseUtils';
import type {
  AddressLike,
  Content,
  MailAttachment,
} from '#app/mail/mail.types';
import { generateUrl } from '#utils/url.js';
import { uniqueLowerCase } from '#utils/string.js';

abstract class RegistrationMessage<
  T extends { registration: Registration },
> extends MailBase<T> {
  protected to(): AddressLike {
    const emails = this.payload.registration.emails;
    if (emails == null) {
      throw new Error('Registration has no email address');
    }

    if (emails.length > 0) {
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

  protected getLocale(): string {
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
    const locale = this.getLocale();
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

class RegistrationMessages extends BaseMessages {
  async sendRegistrationConfirmed(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_confirmed',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationWaitlisted(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_waitlisted',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationWaitlistAccepted(
    camp: Camp,
    registration: Registration,
  ) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_waitlist_accepted',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationUpdated(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_updated',
        camp,
        registration,
      ),
    );
  }

  async sendRegistrationCanceled(camp: Camp, registration: Registration) {
    return catchAndResolve(
      messageService.sendEventMessage(
        'registration_canceled',
        camp,
        registration,
      ),
    );
  }
}

export default new RegistrationMessages();
