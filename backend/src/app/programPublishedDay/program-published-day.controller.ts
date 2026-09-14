import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import type { Request, Response } from 'express';
import { utcCarrierToNaiveDateTime } from '@camp-registration/common/utils';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { ProgramPublishedDayService } from './program-published-day.service.js';
import { ProgramPublishedDayResource } from './program-published-day.resource.js';
import { enumerateDates } from './program-published-day.util.js';
import validator from './program-published-day.validation.js';

@injectable()
export class ProgramPublishedDayController extends BaseController {
  constructor(
    @inject(ProgramPublishedDayService)
    private readonly programPublishedDayService: ProgramPublishedDayService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const days = await this.programPublishedDayService.listPublishedDays(
      event.id,
    );

    res.resource(ProgramPublishedDayResource.collection(days));
  }

  async update(req: Request, res: Response) {
    const { params, body } = await req.validate(validator.update);
    const event = req.modelOrFail('event');

    const day = await this.programPublishedDayService.publishDay(
      event.id,
      params.date,
      body.plan,
    );

    void this.realtimeService.emit(
      event.id,
      'program_published_day',
      day.id,
      'updated',
    );

    res.resource(new ProgramPublishedDayResource(day));
  }

  async bulkPublish(req: Request, res: Response) {
    const { body } = await req.validate(validator.bulkPublish);
    const event = req.modelOrFail('event');

    const dates = enumerateDates(
      utcCarrierToNaiveDateTime(event.startAt).slice(0, 10),
      utcCarrierToNaiveDateTime(event.endAt).slice(0, 10),
    );

    const days = await this.programPublishedDayService.publishAllDays(
      event.id,
      dates,
      body.plan,
    );

    // Bulk operation — a per-day event for every date would trigger a
    // refetch stampede on every connected client; one invalidation lets
    // them each pull the fresh list once.
    void this.realtimeService.emitInvalidation(
      event.id,
      'program_published_day',
    );

    res.resource(ProgramPublishedDayResource.collection(days));
  }

  async destroy(req: Request, res: Response) {
    const { params } = await req.validate(validator.destroy);
    const event = req.modelOrFail('event');

    const deletedId = await this.programPublishedDayService.unpublishDay(
      event.id,
      params.date,
    );

    if (deletedId) {
      void this.realtimeService.emit(
        event.id,
        'program_published_day',
        deletedId,
        'deleted',
      );
    }

    res.status(httpStatus.NO_CONTENT).send();
  }
}
