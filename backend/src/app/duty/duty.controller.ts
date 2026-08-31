import httpStatus from 'http-status';
import { DutyService } from './duty.service.js';
import { DutyResource } from './duty.resource.js';
import validator from './duty.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

@injectable()
export class DutyController extends BaseController {
  constructor(
    @inject(DutyService) private readonly dutyService: DutyService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  show(req: Request, res: Response) {
    const duty = req.modelOrFail('duty');

    res.resource(new DutyResource(duty));
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const duties = await this.dutyService.queryDuties(event.id);

    res.resource(DutyResource.collection(duties));
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { name, rotationUnit, defaultCount },
    } = await req.validate(validator.store);

    const duty = await this.dutyService.createDuty(event.id, {
      name,
      rotationUnit,
      defaultCount,
    });

    void this.realtimeService.emit(event.id, 'duty', duty.id, 'created');

    res.status(httpStatus.CREATED).resource(new DutyResource(duty));
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const duty = req.modelOrFail('duty');
    const {
      body: { name, sortOrder, rotationUnit, defaultCount },
    } = await req.validate(validator.update);

    const updatedDuty = await this.dutyService.updateDutyById(duty.id, {
      name,
      sortOrder,
      rotationUnit,
      defaultCount,
    });

    void this.realtimeService.emit(event.id, 'duty', updatedDuty.id, 'updated');

    res.resource(new DutyResource(updatedDuty));
  }

  async destroy(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const duty = req.modelOrFail('duty');
    await req.validate(validator.destroy);

    await this.dutyService.deleteDutyById(duty.id);

    void this.realtimeService.emit(event.id, 'duty', duty.id, 'deleted');

    res.status(httpStatus.NO_CONTENT).send();
  }
}
