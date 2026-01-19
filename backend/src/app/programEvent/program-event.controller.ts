import httpStatus from 'http-status';
import { ProgramEventService } from './program-event.service.js';
import { ProgramEventResource } from './program-event.resource.js';
import { BaseController } from '#core/base/BaseController';
import type { Request, Response } from 'express';
import validator from '#app/programEvent/program-event.validation';
import { inject, injectable } from 'inversify';

@injectable()
export class ProgramEventController extends BaseController {
  constructor(
    @inject(ProgramEventService)
    private readonly programEventService: ProgramEventService,
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

    const event = await this.programEventService.createProgramEvent(campId, {
      title: body.title,
      details: body.details ?? undefined,
      location: body.location ?? undefined,
      date: body.date,
      time: body.time,
      duration: body.duration,
      color: body.color,
      side: body.side,
    });

    res.status(httpStatus.CREATED).resource(new ProgramEventResource(event));
  }

  async update(req: Request, res: Response) {
    const {
      params: { programEventId: id },
      body,
    } = await req.validate(validator.update);

    const event = await this.programEventService.updateProgramEventById(id, {
      title: body.title,
      details: body.details,
      location: body.location,
      date: body.date,
      time: body.time,
      duration: body.duration,
      color: body.color,
      side: body.side,
    });

    res.resource(new ProgramEventResource(event));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { programEventId: id },
    } = await req.validate(validator.destroy);

    await this.programEventService.deleteProgramEventById(id);

    res.status(httpStatus.NO_CONTENT).send();
  }
}
