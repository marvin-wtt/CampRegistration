import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import templateController from './table-template.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import tableTemplateService from '#app/tableTemplate/table-template.service';

export class TableTemplateRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('tableTemplate', (req, id) => {
      const camp = req.modelOrFail('camp');
      return tableTemplateService.getTemplateById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.table_templates.view')),
      controller(templateController, 'index'),
    );
    this.router.get(
      '/:tableTemplateId',
      auth(),
      guard(campManager('camp.table_templates.view')),
      controller(templateController, 'show'),
    );
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.table_templates.create')),
      controller(templateController, 'store'),
    );
    this.router.put(
      '/:tableTemplateId',
      auth(),
      guard(campManager('camp.table_templates.edit')),
      controller(templateController, 'update'),
    );
    this.router.delete(
      '/:tableTemplateId',
      auth(),
      guard(campManager('camp.table_templates.delete')),
      controller(templateController, 'destroy'),
    );
  }
}
