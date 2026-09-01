import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { RegistrationRouter } from '#app/registration/registration.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
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

export class RegistrationModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(RegistrationService).toSelf().inSingletonScope();
    options.bind(RegistrationController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    // Manual -> Registration
    resolve(MailableRegistry).register(RegistrationTemplateMessage);
    // Event -> Event Contact
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
      '/events/:eventsId/registrations/:registrationId/files',
      new RegistrationFilesRouter(),
    );
    router.useRouter(
      '/events/:eventId/registrations',
      new RegistrationRouter(),
    );
  }

  registerPermissions(): ScopedPermissions {
    // The 'event.registrations.create' permission bypasses the registration
    // open/close checks, allowing managers to create registrations outside
    // the normal registration period.
    return {
      event: {
        DIRECTOR: [
          'event.registrations.view',
          'event.registrations.create',
          'event.registrations.edit',
          'event.registrations.delete',
        ],
        COORDINATOR: [
          'event.registrations.view',
          'event.registrations.create',
          'event.registrations.edit',
          'event.registrations.delete',
        ],
        COUNSELOR: ['event.registrations.view', 'event.registrations.create'],
        VIEWER: ['event.registrations.view'],
      },
    };
  }
}
