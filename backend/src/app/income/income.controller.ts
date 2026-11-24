import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { IncomeService } from '#app/income/income.service';
import { IncomeResource } from '#app/income/income.resource';
import validator from '#app/income/income.validation';

@injectable()
export class IncomeController extends BaseController {
  constructor(
    @inject(IncomeService) private readonly incomeService: IncomeService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const incomes = await this.incomeService.queryIncomes(event.id);

    res.resource(IncomeResource.collection(incomes));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);

    res.resource(new IncomeResource(req.modelOrFail('income')));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const event = req.modelOrFail('event');

    const income = await this.incomeService.createIncome(
      event.id,
      body,
      req.authUserId(),
      req.sessionId,
    );

    void this.realtimeService.emit(event.id, 'income', income.id, 'created');

    res.status(httpStatus.CREATED).resource(new IncomeResource(income));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const income = req.modelOrFail('income');

    const updated = await this.incomeService.updateIncome(
      income,
      body,
      req.sessionId,
    );

    void this.realtimeService.emit(
      updated.eventId,
      'income',
      updated.id,
      'updated',
    );

    res.resource(new IncomeResource(updated));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const income = req.modelOrFail('income');

    await this.incomeService.deleteIncome(income);

    void this.realtimeService.emit(
      income.eventId,
      'income',
      income.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
