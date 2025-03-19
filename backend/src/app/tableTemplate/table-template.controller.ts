import httpStatus from 'http-status';
import { collection, resource } from '#core/resource';
import tableTemplateService from './table-template.service.js';
import tableTemplateResource from './table-template.resource.js';
import validator from './table-template.validation.js';
import { type Request, type Response } from 'express';

const show = (req: Request, res: Response) => {
  const template = req.modelOrFail('tableTemplate');

  res.json(resource(tableTemplateResource(template)));
};

const index = async (req: Request, res: Response) => {
  const {
    params: { campId },
  } = await req.validate(validator.index);

  const templates = await tableTemplateService.queryTemplates(campId);
  const resources = templates.map((value) => tableTemplateResource(value));

  res.json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const {
    params: { campId },
    body,
  } = await req.validate(validator.store);

  const template = await tableTemplateService.createTemplate(campId, body);

  res
    .status(httpStatus.CREATED)
    .json(resource(tableTemplateResource(template)));
};

const update = async (req: Request, res: Response) => {
  const {
    params: { templateId },
    body,
  } = await req.validate(validator.update);

  const template = await tableTemplateService.updateTemplateById(
    templateId,
    body,
  );

  res.json(resource(tableTemplateResource(template)));
};

const destroy = async (req: Request, res: Response) => {
  const {
    params: { templateId },
  } = await req.validate(validator.destroy);

  await tableTemplateService.deleteTemplateById(templateId);

  res.status(httpStatus.NO_CONTENT).send();
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};
