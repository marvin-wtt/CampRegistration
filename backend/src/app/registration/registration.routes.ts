import registrationController from './registration.controller.js';
import { auth, guard } from '#middlewares/index';
import { campActive, campManager } from '#guards/index';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import registrationService from '#app/registration/registration.service';

export class RegistrationRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('registration', (req, id) => {
      const camp = req.modelOrFail('camp');
      return registrationService.getRegistrationById(camp.id, id);
    });
  }

  protected defineRoutes() {
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
      guard(campActive),
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
