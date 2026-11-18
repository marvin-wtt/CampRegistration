import { inject, injectable } from 'inversify';
import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { hasEventPermission } from '#app/event/event.guard';
import { financeMember } from '#app/finance/finance.guard';
import { FinanceCategoryService } from '#app/financeCategory/finance-category.service';
import { FinanceCategoryController } from '#app/financeCategory/finance-category.controller';

@injectable()
export class FinanceCategoryRouter extends ModuleRouter {
  constructor(
    @inject(FinanceCategoryService)
    private readonly categoryService: FinanceCategoryService,
    @inject(FinanceCategoryController)
    private readonly categoryController: FinanceCategoryController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('financeCategory', (req, id) => {
      const event = req.modelOrFail('event');
      return this.categoryService.getCategoryById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    const configure = guard(hasEventPermission('event.finances.configure'));

    // Everyone who records expenses needs the picker.
    this.router.get(
      '/',
      guard(financeMember),
      controller(this.categoryController, 'index'),
    );
    this.router.post(
      '/',
      configure,
      controller(this.categoryController, 'store'),
    );
    this.router.put(
      '/order',
      configure,
      controller(this.categoryController, 'order'),
    );
    this.router.patch(
      '/:financeCategoryId',
      configure,
      controller(this.categoryController, 'update'),
    );
    this.router.delete(
      '/:financeCategoryId',
      configure,
      controller(this.categoryController, 'destroy'),
    );
  }
}
