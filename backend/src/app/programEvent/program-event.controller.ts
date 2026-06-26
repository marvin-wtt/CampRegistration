import httpStatus from 'http-status';
import { ProgramEventService } from './program-event.service.js';
import { ProgramEventResource } from './program-event.resource.js';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import type { Request, Response } from 'express';
import validator from '#app/programEvent/program-event.validation';
import { inject, injectable } from 'inversify';

@injectable()
export class ProgramEventController extends BaseController {
  constructor(
    @inject(ProgramEventService)
    private readonly programEventService: ProgramEventService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const event = req.modelOrFail('programEvent');

    res.resource(new ProgramEventResource(event));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const events = await this.programEventService.queryProgramEvent(campId);

    res.resource(ProgramEventResource.collection(events));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body,
    } = await req.validate(validator.store);
    const camp = req.modelOrFail('camp');

    const event = await this.programEventService.createProgramEvent(campId, {
      title: body.title,
      details: body.details ?? undefined,
      location: body.location ?? undefined,
      date: body.date,
      time: body.time,
      duration: body.duration,
      color: body.color,
      plan: body.plan ?? 'both',
    });

    await this.realtimeService.emit(
      camp.id,
      'program_event',
      event.id,
      'created',
      req.clientId(),
    );

    res.status(httpStatus.CREATED).resource(new ProgramEventResource(event));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const programEvent = req.modelOrFail('programEvent');
    const camp = req.modelOrFail('camp');

    const event = await this.programEventService.updateProgramEventById(
      programEvent.id,
      {
        title: body.title,
        details: body.details,
        location: body.location,
        date: body.date,
        time: body.time,
        duration: body.duration,
        color: body.color,
        plan: body.plan,
      },
    );

    await this.realtimeService.emit(
      camp.id,
      'program_event',
      event.id,
      'updated',
      req.clientId(),
    );

    res.resource(new ProgramEventResource(event));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const programEvent = req.modelOrFail('programEvent');
    const camp = req.modelOrFail('camp');

    await this.programEventService.deleteProgramEventById(programEvent.id);

    await this.realtimeService.emit(
      camp.id,
      'program_event',
      programEvent.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
