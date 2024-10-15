import httpStatus from 'http-status';
import { collection, resource } from 'app/resource';
import tableTemplateService from './table-template.service';
import tableTemplateResource from './table-template.resource';
import { routeModel } from 'utils/verifyModel';
import { Request, Response } from 'express';

const show = async (req: Request, res: Response) => {
  const template = routeModel(req.models.tableTemplate);

  res.json(resource(tableTemplateResource(template)));
};

const index = async (req: Request, res: Response) => {
  const { campId } = req.params;
  const templates = await tableTemplateService.queryTemplates(campId);
  const resources = templates.map((value) => tableTemplateResource(value));

  res.json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const { campId } = req.params;
  const data = req.body;
  const template = await tableTemplateService.createTemplate(campId, data);
  res
    .status(httpStatus.CREATED)
    .json(resource(tableTemplateResource(template)));
};

const update = async (req: Request, res: Response) => {
  const { templateId } = req.params;
  const data = req.body;
  const template = await tableTemplateService.updateTemplateById(
    templateId,
    data,
  );
  res.json(resource(tableTemplateResource(template)));
};

const destroy = async (req: Request, res: Response) => {
  const { templateId } = req.params;
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
