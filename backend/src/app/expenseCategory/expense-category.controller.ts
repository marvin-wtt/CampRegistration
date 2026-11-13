import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { ExpenseCategoryService } from '#app/expenseCategory/expense-category.service';
import { ExpenseCategoryResource } from '#app/expenseCategory/expense-category.resource';
import validator from '#app/expenseCategory/expense-category.validation';

@injectable()
export class ExpenseCategoryController extends BaseController {
  constructor(
    @inject(ExpenseCategoryService)
    private readonly categoryService: ExpenseCategoryService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const categories = await this.categoryService.queryCategories(event.id);

    res.resource(ExpenseCategoryResource.collection(categories));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const event = req.modelOrFail('event');

    const category = await this.categoryService.createCategory(event.id, body);

    void this.realtimeService.emit(
      event.id,
      'expense_category',
      category.id,
      'created',
    );

    res
      .status(httpStatus.CREATED)
      .resource(new ExpenseCategoryResource(category));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const category = req.modelOrFail('expenseCategory');

    const updated = await this.categoryService.updateCategory(category, body);

    void this.realtimeService.emit(
      updated.eventId,
      'expense_category',
      updated.id,
      'updated',
    );

    res.resource(new ExpenseCategoryResource(updated));
  }

  async order(req: Request, res: Response) {
    const { body } = await req.validate(validator.order);
    const event = req.modelOrFail('event');

    const categories = await this.categoryService.reorderCategories(
      event.id,
      body.items,
    );

    void this.realtimeService.emitInvalidation(event.id, 'expense_category');

    res.resource(ExpenseCategoryResource.collection(categories));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const category = req.modelOrFail('expenseCategory');

    await this.categoryService.deleteCategory(category);

    void this.realtimeService.emit(
      category.eventId,
      'expense_category',
      category.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
