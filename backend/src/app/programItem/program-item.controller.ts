import httpStatus from 'http-status';
import { ProgramItemService } from './program-item.service.js';
import { ProgramItemResource } from './program-item.resource.js';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import type { Request, Response } from 'express';
import validator from '#app/programItem/program-item.validation';
import { inject, injectable } from 'inversify';

@injectable()
export class ProgramItemController extends BaseController {
  constructor(
    @inject(ProgramItemService)
    private readonly programItemService: ProgramItemService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const programItem = req.modelOrFail('programItem');

    res.resource(new ProgramItemResource(programItem));
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const programItems = await this.programItemService.queryProgramItem(
      event.id,
    );

    res.resource(ProgramItemResource.collection(programItems));
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const { body } = await req.validate(validator.store);

    const programItem = await this.programItemService.createProgramItem(
      event.id,
      {
        title: body.title,
        details: body.details ?? undefined,
        location: body.location ?? undefined,
        date: body.date,
        time: body.time,
        duration: body.duration,
        color: body.color,
        plan: body.plan ?? 'both',
      },
    );

    void this.realtimeService.emit(
      event.id,
      'program_item',
      programItem.id,
      'created',
    );

    res
      .status(httpStatus.CREATED)
      .resource(new ProgramItemResource(programItem));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const programItem = req.modelOrFail('programItem');
    const event = req.modelOrFail('event');

    const updated = await this.programItemService.updateProgramItemById(
      programItem.id,
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

    void this.realtimeService.emit(
      event.id,
      'program_item',
      updated.id,
      'updated',
    );

    res.resource(new ProgramItemResource(updated));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const programItem = req.modelOrFail('programItem');
    const event = req.modelOrFail('event');

    await this.programItemService.deleteProgramItemById(programItem.id);

    void this.realtimeService.emit(
      event.id,
      'program_item',
      programItem.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
