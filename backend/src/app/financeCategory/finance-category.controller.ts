import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { FinanceCategoryService } from '#app/financeCategory/finance-category.service';
import { FinanceCategoryResource } from '#app/financeCategory/finance-category.resource';
import validator from '#app/financeCategory/finance-category.validation';

@injectable()
export class FinanceCategoryController extends BaseController {
  constructor(
    @inject(FinanceCategoryService)
    private readonly categoryService: FinanceCategoryService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const {
      query: { kind },
    } = await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const categories = await this.categoryService.queryCategories(
      event.id,
      kind,
    );

    res.resource(FinanceCategoryResource.collection(categories));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const event = req.modelOrFail('event');

    const category = await this.categoryService.createCategory(event.id, body);

    void this.realtimeService.emit(
      event.id,
      'finance_category',
      category.id,
      'created',
    );

    res
      .status(httpStatus.CREATED)
      .resource(new FinanceCategoryResource(category));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const category = req.modelOrFail('financeCategory');

    const updated = await this.categoryService.updateCategory(category, body);

    void this.realtimeService.emit(
      updated.eventId,
      'finance_category',
      updated.id,
      'updated',
    );

    res.resource(new FinanceCategoryResource(updated));
  }

  async order(req: Request, res: Response) {
    const {
      body,
      query: { kind },
    } = await req.validate(validator.order);
    const event = req.modelOrFail('event');

    const categories = await this.categoryService.reorderCategories(
      event.id,
      kind,
      body.items,
    );

    void this.realtimeService.emitInvalidation(event.id, 'finance_category');

    res.resource(FinanceCategoryResource.collection(categories));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const category = req.modelOrFail('financeCategory');

    await this.categoryService.deleteCategory(category);

    void this.realtimeService.emit(
      category.eventId,
      'finance_category',
      category.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
