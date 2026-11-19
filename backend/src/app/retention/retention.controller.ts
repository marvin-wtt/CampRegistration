import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import { RetentionService } from './retention.service.js';
import {
  EventRetentionResource,
  RetentionOverviewResource,
} from './retention.resource.js';
import validator from './retention.validation.js';

@injectable()
export class RetentionController extends BaseController {
  constructor(
    @inject(RetentionService)
    private readonly retentionService: RetentionService,
    @inject(EventManagerService)
    private readonly eventManagerService: EventManagerService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const event = req.modelOrFail('event');

    await this.retentionService.syncEvent(event);
    res.resource(await this.eventRetention(req));
  }

  async postpone(req: Request, res: Response) {
    const { params, body } = await req.validate(validator.postpone);
    const event = req.modelOrFail('event');

    await this.retentionService.postpone(event, params.kind, body);
    res.resource(await this.eventRetention(req));
  }

  async purgeSensitive(req: Request, res: Response) {
    await req.validate(validator.purge);
    const event = req.modelOrFail('event');

    await this.retentionService.purgeSensitiveData(event);
    void this.realtimeService.emitInvalidation(event.id, 'registration');
    res.status(httpStatus.NO_CONTENT).send();
  }

  async purgeRegistrations(req: Request, res: Response) {
    await req.validate(validator.purge);
    const event = req.modelOrFail('event');

    await this.retentionService.purgeRegistrationData(event);
    void this.realtimeService.emitInvalidation(event.id, 'registration');
    res.status(httpStatus.NO_CONTENT).send();
  }

  async organization(req: Request, res: Response) {
    await req.validate(validator.organization);
    const organization = req.modelOrFail('organization');

    const deadlines = await this.retentionService.openDeadlines(
      organization.id,
    );
    res.resource(RetentionOverviewResource.collection(deadlines));
  }

  async platform(_req: Request, res: Response) {
    const deadlines = await this.retentionService.openDeadlines();
    res.resource(RetentionOverviewResource.collection(deadlines));
  }

  private async eventRetention(req: Request) {
    // Re-read: an action may just have changed the purge state.
    const eventId = req.modelOrFail('event').id;
    const userId = req.authUserId();
    const [event, periods, deadlines, registrationCount, withReason] =
      await Promise.all([
        this.retentionService.purgeState(eventId),
        this.retentionService.currentPeriods(req.modelOrFail('event')),
        this.retentionService.deadlines(eventId),
        this.retentionService.registrationCount(eventId),
        userId
          ? this.eventManagerService.eventManagerHasPermission(
              eventId,
              userId,
              'event.registrations.delete',
            )
          : false,
      ]);

    return new EventRetentionResource({
      event,
      deadlines,
      registrationCount,
      periods,
      withReason,
    });
  }
}
