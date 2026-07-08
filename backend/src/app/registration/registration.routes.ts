import { RegistrationController } from './registration.controller.js';
import { auth, guard } from '#middlewares/index';
import { or } from '#core/guard';
import { campManager } from '#app/campManager/camp-manager.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { RegistrationService } from '#app/registration/registration.service';
import { resolve } from '#core/ioc/container';
import { registrationOpen } from '#app/camp/camp.guard';

export class RegistrationRouter extends ModuleRouter {
  protected registerBindings() {
    const registrationService = resolve(RegistrationService);
    this.bindModel('registration', (req, id) => {
      const camp = req.model('camp');
      if (!camp) {
        return null;
      }
      return registrationService.getRegistrationById(camp.id, id);
    });
  }

  protected defineRoutes() {
    const registrationController = resolve(RegistrationController);

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.registrations.view')),
      controller(registrationController, 'index'),
    );
    this.router.get(
      '/:registrationId',
      auth(),
      guard(campManager('camp.registrations.view')),
      controller(registrationController, 'show'),
    );
    this.router.post(
      '/',
      guard(or(registrationOpen, campManager('camp.registrations.create'))),
      controller(registrationController, 'store'),
    );
    this.router.patch(
      '/:registrationId',
      auth(),
      guard(campManager('camp.registrations.edit')),
      controller(registrationController, 'update'),
    );
    this.router.delete(
      '/:registrationId',
      auth(),
      guard(campManager('camp.registrations.delete')),
      controller(registrationController, 'destroy'),
    );
  }
}
