import { inject, injectable } from 'inversify';
import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { hasEventPermission } from '#app/event/event.guard';
import { financeMember } from '#app/finance/finance.guard';
import { ExpenseCategoryService } from '#app/expenseCategory/expense-category.service';
import { ExpenseCategoryController } from '#app/expenseCategory/expense-category.controller';

@injectable()
export class ExpenseCategoryRouter extends ModuleRouter {
  constructor(
    @inject(ExpenseCategoryService)
    private readonly categoryService: ExpenseCategoryService,
    @inject(ExpenseCategoryController)
    private readonly categoryController: ExpenseCategoryController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('expenseCategory', (req, id) => {
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
      '/:expenseCategoryId',
      configure,
      controller(this.categoryController, 'update'),
    );
    this.router.delete(
      '/:expenseCategoryId',
      configure,
      controller(this.categoryController, 'destroy'),
    );
  }
}
