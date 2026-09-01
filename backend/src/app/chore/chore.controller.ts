import httpStatus from 'http-status';
import { ChoreService } from './chore.service.js';
import { ChoreResource } from './chore.resource.js';
import validator from './chore.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

@injectable()
export class ChoreController extends BaseController {
  constructor(
    @inject(ChoreService) private readonly choreService: ChoreService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  show(req: Request, res: Response) {
    const chore = req.modelOrFail('chore');

    res.resource(new ChoreResource(chore));
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const chores = await this.choreService.queryChores(event.id);

    res.resource(ChoreResource.collection(chores));
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { name, defaultCount, excludeStaff, balanceCountries },
    } = await req.validate(validator.store);

    const chore = await this.choreService.createChore(event.id, {
      name,
      defaultCount,
      excludeStaff,
      balanceCountries,
    });

    void this.realtimeService.emit(event.id, 'chore', chore.id, 'created');

    res.status(httpStatus.CREATED).resource(new ChoreResource(chore));
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const chore = req.modelOrFail('chore');
    const {
      body: { name, sortOrder, defaultCount, excludeStaff, balanceCountries },
    } = await req.validate(validator.update);

    const updatedChore = await this.choreService.updateChoreById(chore.id, {
      name,
      sortOrder,
      defaultCount,
      excludeStaff,
      balanceCountries,
    });

    void this.realtimeService.emit(
      event.id,
      'chore',
      updatedChore.id,
      'updated',
    );

    res.resource(new ChoreResource(updatedChore));
  }

  async destroy(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const chore = req.modelOrFail('chore');
    await req.validate(validator.destroy);

    await this.choreService.deleteChoreById(chore.id);

    void this.realtimeService.emit(event.id, 'chore', chore.id, 'deleted');

    res.status(httpStatus.NO_CONTENT).send();
  }
}
