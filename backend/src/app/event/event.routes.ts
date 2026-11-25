import { ModuleRouter } from '#core/router/ModuleRouter';
import { EventController } from '#app/event/event.controller';
import { EventService } from './event.service.js';
import { auth } from '#core/auth/auth.middleware';
import { admin, and, guard, or } from '#core/guard';
import { eventManagerSubscriber } from '#app/eventManager/event-manager.guard';
import type { EventQuery } from '@camp-registration/common/entities';
import { controller } from '#core/router/bindController';
import { realtimeStream } from '#app/realtime/realtime.stream';
import { resolve } from '#core/ioc/container';
import {
  canCopyReferenceEvent,
  hasEventPermission,
  eventViewGuard,
} from '#app/event/event.guard';
import { organizationFromBody } from '#app/organization/organization.middleware';
import { organizationMember } from '#app/organization/organization.guard';

export class EventRouter extends ModuleRouter {
  protected registerBindings() {
    const eventService = resolve(EventService);
    this.bindModel('event', (_req, id) => eventService.getEventById(id));
  }

  protected defineRoutes() {
    const eventController: EventController = resolve(EventController);

    this.router.get(
      '/',
      // `view=all` is the moderation list: metadata only, no grant needed.
      guard(
        or(admin, (req) => {
          const view = (req.query as EventQuery).view;
          return (
            view !== 'all' && (view !== 'assigned' || req.isAuthenticated())
          );
        }),
      ),
      controller(eventController, 'index'),
    );

    // `eventViewGuard` is shared with the link-preview route in
    // `event-meta.routes.ts`. Read the warning on `eventPubliclyVisible` before
    // changing who may see an event.
    this.router.get(
      '/:eventId',
      guard(eventViewGuard),
      controller(eventController, 'show'),
    );

    // The event's single live-updates stream. Carries all event resources; each
    // update is filtered against the subscriber's permission set, so resources
    // not every role may see (managers, messages, ...) are safe to carry here.
    this.router.get(
      '/:eventId/stream',
      auth(),
      guard(hasEventPermission('event.view')),
      realtimeStream(eventManagerSubscriber),
    );

    this.router.post(
      '/',
      auth(),
      organizationFromBody(),
      guard(
        and(
          organizationMember('organization.events.create'),
          canCopyReferenceEvent,
        ),
      ),
      controller(eventController, 'store'),
    );

    this.router.patch(
      '/:eventId',
      auth(),
      guard(hasEventPermission('event.edit')),
      controller(eventController, 'update'),
    );

    // Reassigning ownership is a system-administrator action — bare `guard()`.
    this.router.patch(
      '/:eventId/organization',
      auth(),
      organizationFromBody(),
      guard(),
      controller(eventController, 'updateOrganization'),
    );

    this.router.delete(
      '/:eventId',
      auth(),
      guard(hasEventPermission('event.delete')),
      controller(eventController, 'destroy'),
    );
  }
}
