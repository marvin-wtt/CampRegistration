import { catchRequestAsync } from 'utils/catchAsync';
import httpStatus from 'http-status';
import { collection, resource } from 'resources/resource';
import { tableTemplateService } from 'services';
import { tableTemplateResource } from 'resources';
import { routeModel } from 'utils/verifyModel';

const show = catchRequestAsync(async (req, res) => {
  const template = routeModel(req.models.tableTemplate);

  res.json(resource(tableTemplateResource(template)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const templates = await tableTemplateService.queryTemplates(campId);
  const resources = templates.map((value) => tableTemplateResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;
  const template = await tableTemplateService.createTemplate(campId, data);
  res
    .status(httpStatus.CREATED)
    .json(resource(tableTemplateResource(template)));
});

const update = catchRequestAsync(async (req, res) => {
  const { templateId } = req.params;
  const data = req.body;
  const template = await tableTemplateService.updateTemplateById(
    templateId,
    data,
  );
  res.json(resource(tableTemplateResource(template)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { templateId } = req.params;
  await tableTemplateService.deleteTemplateById(templateId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
