import httpStatus from 'http-status';
import { collection, resource } from '#core/resource';
import tableTemplateService from './table-template.service.js';
import tableTemplateResource from './table-template.resource.js';
import { routeModel } from '#utils/verifyModel';
import { validateRequest } from '#core/validation/request';
import validator from './table-template.validation.js';
import { type Request, type Response } from 'express';

const show = async (req: Request, res: Response) => {
  const template = routeModel(req.models.tableTemplate);

  res.json(resource(tableTemplateResource(template)));
};

const index = async (req: Request, res: Response) => {
  const {
    params: { campId },
  } = await validateRequest(req, validator.index);

  const templates = await tableTemplateService.queryTemplates(campId);
  const resources = templates.map((value) => tableTemplateResource(value));

  res.json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const {
    params: { campId },
    body,
  } = await validateRequest(req, validator.store);

  const template = await tableTemplateService.createTemplate(campId, body);

  res
    .status(httpStatus.CREATED)
    .json(resource(tableTemplateResource(template)));
};

const update = async (req: Request, res: Response) => {
  const {
    params: { templateId },
    body,
  } = await validateRequest(req, validator.update);

  const template = await tableTemplateService.updateTemplateById(
    templateId,
    body,
  );

  res.json(resource(tableTemplateResource(template)));
};

const destroy = async (req: Request, res: Response) => {
  const {
    params: { templateId },
  } = await validateRequest(req, validator.destroy);

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
