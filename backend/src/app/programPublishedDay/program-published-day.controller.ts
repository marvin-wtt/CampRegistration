import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { ProgramPublishedDayService } from './program-published-day.service.js';
import { ProgramPublishedDayResource } from './program-published-day.resource.js';
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
