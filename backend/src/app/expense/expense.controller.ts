import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { ExpenseService } from '#app/expense/expense.service';
import { ExpenseResource } from '#app/expense/expense.resource';
import validator from '#app/expense/expense.validation';

@injectable()
export class ExpenseController extends BaseController {
  constructor(
    @inject(ExpenseService) private readonly expenseService: ExpenseService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const { view, ...filter } = query;
    const expenses = await this.expenseService.queryExpenses(event.id, {
      ...filter,
      ownerId: view === 'own' ? req.authUserId() : undefined,
    });

    res.resource(ExpenseResource.collection(expenses));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);

    res.resource(new ExpenseResource(req.modelOrFail('expense')));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const event = req.modelOrFail('event');

    const expense = await this.expenseService.createExpense(
      event.id,
      body,
      req.authUserId(),
      req.sessionId,
    );

    void this.realtimeService.emit(event.id, 'expense', expense.id, 'created');

    res.status(httpStatus.CREATED).resource(new ExpenseResource(expense));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const expense = req.modelOrFail('expense');

    const updated = await this.expenseService.updateExpense(
      expense,
      body,
      req.sessionId,
    );

    void this.realtimeService.emit(
      updated.eventId,
      'expense',
      updated.id,
      'updated',
    );

    res.resource(new ExpenseResource(updated));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const expense = req.modelOrFail('expense');

    await this.expenseService.deleteExpense(expense);

    void this.realtimeService.emit(
      expense.eventId,
      'expense',
      expense.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
