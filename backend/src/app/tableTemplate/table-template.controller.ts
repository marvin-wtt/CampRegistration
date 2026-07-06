import httpStatus from 'http-status';
import { TableTemplateService } from './table-template.service.js';
import validator from './table-template.validation.js';
import { type Request, type Response } from 'express';
import { TableTemplateResource } from '#app/tableTemplate/table-template.resource';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

@injectable()
export class TableTemplateController extends BaseController {
  constructor(
    @inject(TableTemplateService)
    private readonly tableTemplateService: TableTemplateService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  show(req: Request, res: Response) {
    const template = req.modelOrFail('tableTemplate');

    res.resource(new TableTemplateResource(template));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const templates = await this.tableTemplateService.queryTemplates(campId);

    res.resource(TableTemplateResource.collection(templates));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body,
    } = await req.validate(validator.store);

    const template = await this.tableTemplateService.createTemplate(
      campId,
      body,
    );

    await this.realtimeService.emit(
      campId,
      'table_template',
      template.id,
      'created',
      req.clientId(),
    );

    res
      .status(httpStatus.CREATED)
      .resource(new TableTemplateResource(template));
  }

  async update(req: Request, res: Response) {
    const {
      params: { campId, tableTemplateId },
      body,
    } = await req.validate(validator.update);

    const template = await this.tableTemplateService.updateTemplateById(
      tableTemplateId,
      body,
    );

    await this.realtimeService.emit(
      campId,
      'table_template',
      template.id,
      'updated',
      req.clientId(),
    );

    res.resource(new TableTemplateResource(template));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { campId, tableTemplateId },
    } = await req.validate(validator.destroy);

    await this.tableTemplateService.deleteTemplateById(tableTemplateId);

    await this.realtimeService.emit(
      campId,
      'table_template',
      tableTemplateId,
      'deleted',
      req.clientId(),
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
