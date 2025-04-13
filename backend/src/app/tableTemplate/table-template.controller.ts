import httpStatus from 'http-status';
import tableTemplateService from './table-template.service.js';
import validator from './table-template.validation.js';
import { type Request, type Response } from 'express';
import { TableTemplateResource } from '#app/tableTemplate/table-template.resource';
import { BaseController } from '#core/base/BaseController';

class TableTemplateController extends BaseController {
  show(req: Request, res: Response) {
    const template = req.modelOrFail('tableTemplate');

    res.resource(new TableTemplateResource(template));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const templates = await tableTemplateService.queryTemplates(campId);

    res.resource(TableTemplateResource.collection(templates));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body,
    } = await req.validate(validator.store);

    const template = await tableTemplateService.createTemplate(campId, body);

    res
      .status(httpStatus.CREATED)
      .resource(new TableTemplateResource(template));
  }

  async update(req: Request, res: Response) {
    const {
      params: { templateId },
      body,
    } = await req.validate(validator.update);

    const template = await tableTemplateService.updateTemplateById(
      templateId,
      body,
    );

    res.resource(new TableTemplateResource(template));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { templateId },
    } = await req.validate(validator.destroy);

    await tableTemplateService.deleteTemplateById(templateId);

    res.status(httpStatus.NO_CONTENT).send();
  }
}

export default new TableTemplateController();
