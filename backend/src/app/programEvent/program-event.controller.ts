import httpStatus from 'http-status';
import programEventService from './program-event.service.js';
import { ProgramEventResource } from './program-event.resource.js';
import { BaseController } from '#core/base/BaseController';
import type { Request, Response } from 'express';
import validator from '#app/programEvent/program-event.validation';

class ProgramEventController extends BaseController {
  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const event = req.modelOrFail('programEvent');

    res.resource(new ProgramEventResource(event));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const events = await programEventService.queryProgramEvent(campId);

    res.resource(ProgramEventResource.collection(events));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body,
    } = await req.validate(validator.store);

    const event = await programEventService.createProgramEvent(campId, {
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

    const event = await programEventService.updateProgramEventById(id, {
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

    await programEventService.deleteProgramEventById(id);

    res.status(httpStatus.NO_CONTENT).send();
  }
}

export default new ProgramEventController();
