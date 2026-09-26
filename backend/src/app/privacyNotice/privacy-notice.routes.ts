import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { or } from '#core/guard';
import { organizationMember } from '#app/organization/organization.guard';
import {
  hasEventPermission,
  eventOrganizationVerified,
} from '#app/event/event.guard';
import { PrivacyNoticeController } from './privacy-notice.controller.js';

/**
 * The organization's notice. Guarded by `organization.view`/`organization.edit`
 * rather than permissions of its own: authoring it *is* editing the
 * organization, and a separate pair would widen the matrix for no new decision.
 */
export class OrganizationPrivacyNoticeRouter extends ModuleRouter {
  protected registerBindings() {
    // `organization` is bound by the organization router, app-wide.
  }

  protected defineRoutes() {
    const privacyNoticeController = resolve(PrivacyNoticeController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(organizationMember('organization.view')),
      controller(privacyNoticeController, 'showOrganization'),
    );
    // A replace, not an append: the client sends the notice it wants live, and
    // sending the same one twice leaves the same single version behind.
    this.router.put(
      '/',
      guard(organizationMember('organization.edit')),
      controller(privacyNoticeController, 'updateOrganization'),
    );
  }
}

/**
 * The composed, published notice a registrant reads. Reachable exactly where
 * the event itself is — same guard as `GET /events/:eventId` — so a preview link
 * shows the notice and an unverified organization's event stays hidden.
 *
 * `/addendum` is the event manager's authoring view — the event's own additions
 * plus the organization baseline they are added to — read and written at the
 * same path. Writing is publishing; an unfinished edit lives in the author's
 * browser and nowhere else.
 */
export class EventPrivacyNoticeRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` is bound by the event router, app-wide.
  }

  protected defineRoutes() {
    const privacyNoticeController = resolve(PrivacyNoticeController);

    this.router.get(
      '/',
      guard(or(eventOrganizationVerified, hasEventPermission('event.view'))),
      controller(privacyNoticeController, 'showPublished'),
    );

    this.router.get(
      '/addendum',
      auth(),
      guard(hasEventPermission('event.view')),
      controller(privacyNoticeController, 'showAddendum'),
    );

    this.router.put(
      '/addendum',
      auth(),
      guard(hasEventPermission('event.edit')),
      controller(privacyNoticeController, 'updateAddendum'),
    );
  }
}
