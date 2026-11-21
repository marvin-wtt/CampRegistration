import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { admin } from '#core/guard';
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

  /** Who may postpone and delete, as the guards decide it, admins included. */
  private async canAct(req: Request, eventId: string): Promise<boolean> {
    if (admin(req) === true) {
      return true;
    }
    const userId = req.authUserId();

    return userId
      ? this.eventManagerService.eventManagerHasPermission(
          eventId,
          userId,
          'event.registrations.delete',
        )
      : false;
  }

  private async eventRetention(req: Request) {
    const event = req.modelOrFail('event');
    const [deadlines, { periods, estimates }, withReason] = await Promise.all([
      this.retentionService.deadlines(event),
      this.retentionService.currentPeriods(event),
      this.canAct(req, event.id),
    ]);

    return new EventRetentionResource({
      event,
      deadlines,
      periods,
      estimates,
      withReason,
    });
  }
}
