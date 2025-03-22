import type { Camp, CampManager, Invitation, User } from '@prisma/client';
import { translateObject } from '#utils/translateObject';
import i18n, { t } from '#core/i18n';
import mailService from '#core/mail/mail.service';
import { BaseMessages } from '#core/BaseMessages.js';

type CampManagerWithUserOrInvitation = CampManager & { user: User | null } & {
  invitation: Invitation | null;
};

class ManagerMessages extends BaseMessages {
  async sendManagerInvitation(
    camp: Camp,
    manager: CampManagerWithUserOrInvitation,
  ) {
    const user = manager.user;
    const to = user?.email ?? manager.invitation?.email;

    /* c8-ignore-next */
    if (!to) return;

    const campName = translateObject(camp.name, user?.locale);
    const url = this.generateUrl(`management/${camp.id}/`);

    const locale =
      user?.locale ?? (camp.countries.length === 1 ? camp.countries[0] : 'en');
    await i18n.changeLanguage(locale);
    const subject = t('manager:email.invitation.subject');

    const context = {
      camp: {
        name: campName,
      },
      user,
      url,
    };

    await mailService.sendTemplateMail({
      template: 'manager-invitation',
      to,
      subject,
      context,
    });
  }
}

export default new ManagerMessages();
