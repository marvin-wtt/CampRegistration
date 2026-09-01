import { RegistrationController } from './registration.controller.js';
import { auth, guard } from '#middlewares/index';
import { or, and } from '#core/guard';
import { hasEventPermission } from '#app/event/event.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { RegistrationService } from '#app/registration/registration.service';
import { resolve } from '#core/ioc/container';
import {
  registrationOpen,
  eventOrganizationVerified,
} from '#app/event/event.guard';

export class RegistrationRouter extends ModuleRouter {
  protected registerBindings() {
    const registrationService = resolve(RegistrationService);
    this.bindModel('registration', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return registrationService.getRegistrationById(event.id, id);
    });
  }

  protected defineRoutes() {
    const registrationController = resolve(RegistrationController);

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.registrations.view')),
      controller(registrationController, 'index'),
    );
    this.router.get(
      '/:registrationId',
      auth(),
      guard(hasEventPermission('event.registrations.view')),
      controller(registrationController, 'show'),
    );
    this.router.post(
      '/',
      guard(
        or(
          and(registrationOpen, eventOrganizationVerified),
          hasEventPermission('event.registrations.create'),
        ),
      ),
      controller(registrationController, 'store'),
    );
    this.router.patch(
      '/:registrationId',
      auth(),
      guard(hasEventPermission('event.registrations.edit')),
      controller(registrationController, 'update'),
    );
    this.router.delete(
      '/:registrationId',
      auth(),
      guard(hasEventPermission('event.registrations.delete')),
      controller(registrationController, 'destroy'),
    );
  }
}
