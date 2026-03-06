import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import { TableTemplateController } from './table-template.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { TableTemplateService } from '#app/tableTemplate/table-template.service';
import { inject, injectable } from 'inversify';

@injectable()
export class TableTemplateRouter extends ModuleRouter {
  constructor(
    @inject(TableTemplateService)
    private readonly tableTemplateService: TableTemplateService,
    @inject(TableTemplateController)
    private readonly templateController: TableTemplateController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('tableTemplate', (req, id) => {
      const camp = req.modelOrFail('camp');
      return this.tableTemplateService.getTemplateById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.table_templates.view')),
      controller(this.templateController, 'index'),
    );
    this.router.get(
      '/:tableTemplateId',
      auth(),
      guard(campManager('camp.table_templates.view')),
      controller(this.templateController, 'show'),
    );
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.table_templates.create')),
      controller(this.templateController, 'store'),
    );
    this.router.put(
      '/:tableTemplateId',
      auth(),
      guard(campManager('camp.table_templates.edit')),
      controller(this.templateController, 'update'),
    );
    this.router.delete(
      '/:tableTemplateId',
      auth(),
      guard(campManager('camp.table_templates.delete')),
      controller(this.templateController, 'destroy'),
    );
  }
}
