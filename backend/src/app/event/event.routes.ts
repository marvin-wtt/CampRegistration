import { ModuleRouter } from '#core/router/ModuleRouter';
import { EventController } from '#app/event/event.controller';
import { EventService } from './event.service.js';
import { auth, guard } from '#middlewares/index';
import { eventManagerSubscriber } from '#app/eventManager/event-manager.guard';
import type { EventQuery } from '@camp-registration/common/entities';
import { controller } from '#utils/bindController';
import { realtimeStream } from '#app/realtime/realtime.stream';
import { resolve } from '#core/ioc/container';
import {
  hasEventPermission,
  eventOrganizationVerified,
} from '#app/event/event.guard';
import { or } from '#core/guard';
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
      guard((req) => {
        const view = (req.query as EventQuery).view;
        return view !== 'all' && (view !== 'assigned' || req.isAuthenticated());
      }),
      controller(eventController, 'index'),
    );

    this.router.get(
      '/:eventId',
      guard(or(eventOrganizationVerified, hasEventPermission('event.view'))),
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
      guard(organizationMember('organization.events.create')),
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
