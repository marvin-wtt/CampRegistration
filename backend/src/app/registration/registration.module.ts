import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { RegistrationRouter } from '#app/registration/registration.routes';
import type {
  ManagerRole,
  RegistrationPermission,
} from '@camp-registration/common/permissions';
import { registerFileGuard } from '#app/file/file.guard';
import { registrationFileGuard } from '#app/registration/registration.guard';
import { RegistrationFilesRouter } from '#app/registration/registration-files.routes';
import { RegistrationService } from '#app/registration/registration.service';
import { RegistrationController } from '#app/registration/registration.controller';
import {
  RegistrationAcceptedMessage,
  RegistrationConfirmedMessage,
  RegistrationDeletedMessage,
  RegistrationNotifyMessage,
  RegistrationTemplateMessage,
  RegistrationUpdatedMessage,
  RegistrationWaitlistedMessage,
} from '#app/registration/registration.messages';
import { MailableRegistry } from '#app/mail/mail.registry';
import { resolve } from '#core/ioc/container';
import { slk } from 'survey-core';
import { config } from '#core/ioc/facades';
import logger from '#core/logger';

export class RegistrationModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(RegistrationService).toSelf().inSingletonScope();
    options.bind(RegistrationController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    this.registerSurveyJsLicense();

    // Manual -> Registration
    resolve(MailableRegistry).register(RegistrationTemplateMessage);
    // Event -> Camp Contact
    resolve(MailableRegistry).register(RegistrationNotifyMessage);
    // Event -> Registration
    resolve(MailableRegistry).register(RegistrationConfirmedMessage);
    resolve(MailableRegistry).register(RegistrationWaitlistedMessage);
    resolve(MailableRegistry).register(RegistrationUpdatedMessage);
    resolve(MailableRegistry).register(RegistrationDeletedMessage);
    resolve(MailableRegistry).register(RegistrationAcceptedMessage);
  }

  registerRoutes(router: AppRouter): void {
    registerFileGuard('registration', {
      view: registrationFileGuard,
    });

    router.useRouter(
      '/camps/:campsId/registrations/:registrationId/files',
      new RegistrationFilesRouter(),
    );
    router.useRouter('/camps/:campId/registrations', new RegistrationRouter());
  }

  registerPermissions(): RoleToPermissions<
    ManagerRole,
    RegistrationPermission
  > {
    return {
      DIRECTOR: [
        'camp.registrations.view',
        'camp.registrations.edit',
        'camp.registrations.delete',
      ],
      COORDINATOR: [
        'camp.registrations.view',
        'camp.registrations.edit',
        'camp.registrations.delete',
      ],
      COUNSELOR: ['camp.registrations.view'],
      VIEWER: ['camp.registrations.view'],
    };
  }

  private registerSurveyJsLicense() {
    const licenceKey = config().surveyjs.licenceKey;
    if (!licenceKey) {
      logger.warn(
        'SurveyJS licence key is not set. PDF export may be watermarked.',
      );
      return;
    }

    console.log(licenceKey);

    slk(licenceKey);
  }
}
