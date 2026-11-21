import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { resolve } from '#core/ioc/container';
import { hasEventPermission } from '#app/event/event.guard';
import { organizationMember } from '#app/organization/organization.guard';
import { RetentionController } from './retention.controller.js';

/**
 * An event's retention deadlines. Anyone who can see the event sees the
 * dates; acting on them — deleting or postponing — takes the permission to
 * delete registrations.
 */
export class EventRetentionRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` is bound by the event router, app-wide.
  }

  protected defineRoutes() {
    const retentionController = resolve(RetentionController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.view')),
      controller(retentionController, 'show'),
    );
    this.router.post(
      '/:kind/postpone',
      guard(hasEventPermission('event.registrations.delete')),
      controller(retentionController, 'postpone'),
    );
    this.router.post(
      '/sensitive/purge',
      guard(hasEventPermission('event.registrations.delete')),
      controller(retentionController, 'purgeSensitive'),
    );
    this.router.post(
      '/registrations/purge',
      guard(hasEventPermission('event.registrations.delete')),
      controller(retentionController, 'purgeRegistrations'),
    );
  }
}

/** Open deadlines of the organization's events: dates and kinds only. */
export class OrganizationRetentionRouter extends ModuleRouter {
  protected registerBindings() {
    // `organization` is bound by the organization router, app-wide.
  }

  protected defineRoutes() {
    const retentionController = resolve(RetentionController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(organizationMember('organization.view')),
      controller(retentionController, 'organization'),
    );
  }
}
