import type { Camp, CampManager, Invitation, User } from '@prisma/client';
import { translateObject } from '#utils/translateObject';
import { MailBase } from '#app/mail/mail.base';
import { generateUrl } from '#utils/url';

type CampManagerWithUserOrInvitation = CampManager & { user: User | null } & {
  invitation: Invitation | null;
};

abstract class ManagerMessage<
  T extends { manager: CampManagerWithUserOrInvitation },
> extends MailBase<T> {
  protected to() {
    const email =
      this.payload.manager.user?.email ??
      this.payload.manager.invitation?.email;

    if (!email) {
      throw new Error('No email address available for manager');
    }

    const name = this.payload.manager.user?.name;
    if (name) {
      return {
        name,
        address: email,
      };
    }

    return email;
  }

  protected getLocale(): string | undefined {
    return this.payload.manager.user?.locale;
  }
}

export class ManagerInvitationMessage extends ManagerMessage<{
  manager: CampManagerWithUserOrInvitation;
  camp: Camp;
}> {
  static readonly type = 'manager:invitation';

  protected getTranslationOptions() {
    return {
      namespace: 'manager',
      keyPrefix: 'email.invitation',
    };
  }

  protected subject(): string {
    const t = this.getT();

    return t('subject');
  }

  protected getLocale(): string | undefined {
    return (
      this.payload.manager.user?.locale ??
      (this.payload.camp.countries.length === 1
        ? this.payload.camp.countries[0]
        : undefined)
    );
  }

  protected content() {
    const camp = this.payload.camp;
    const campName = translateObject(camp.name, this.getLocale());
    const url = generateUrl(['management', camp.id]);

    return {
      template: 'manager-invitation',
      context: {
        camp: {
          ...camp,
          name: campName,
        },
        user: this.payload.manager.user,
        url,
      },
    };
  }
}
