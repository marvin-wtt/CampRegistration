import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { organizationMember } from './organization.guard.js';
import type { OrganizationQuery } from '@camp-registration/common/entities';

export class OrganizationRouter extends ModuleRouter {
  protected registerBindings() {
    const organizationService = resolve(OrganizationService);
    this.bindModel('organization', (_req, id) =>
      organizationService.getOrganizationById(id),
    );
  }

  protected defineRoutes() {
    const organizationController = resolve(OrganizationController);

    this.router.use(auth());

    // `view=all` is the moderation queue; the guard fails for everyone but
    // system administrators, who the guard middleware admits implicitly.
    this.router.get(
      '/',
      guard((req) => (req.query as OrganizationQuery).view !== 'all'),
      controller(organizationController, 'index'),
    );

    // Any authenticated user may found an organization. It starts PENDING and
    // cannot publish anything until a system administrator verifies it.
    this.router.post('/', controller(organizationController, 'store'));

    this.router.get(
      '/:organizationId',
      guard(organizationMember('organization.view')),
      controller(organizationController, 'show'),
    );
    this.router.patch(
      '/:organizationId',
      guard(organizationMember('organization.edit')),
      controller(organizationController, 'update'),
    );
    this.router.delete(
      '/:organizationId',
      guard(organizationMember('organization.delete')),
      controller(organizationController, 'destroy'),
    );

    // The organization's camps. Its administrators hold camp permissions that
    // no other listing would surface — see the controller.
    this.router.get(
      '/:organizationId/camps',
      guard(organizationMember('organization.camps.view')),
      controller(organizationController, 'camps'),
    );

    // Resubmit after a rejection.
    this.router.post(
      '/:organizationId/verification',
      guard(organizationMember('organization.edit')),
      controller(organizationController, 'submitVerification'),
    );

    // The moderation decision — bare `guard()` is administrators only.
    this.router.patch(
      '/:organizationId/verification',
      guard(),
      controller(organizationController, 'review'),
    );
  }
}
