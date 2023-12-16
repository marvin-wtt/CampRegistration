import { catchRequestAsync } from 'utils/catchAsync';
import httpStatus from 'http-status';
import { collection, resource } from 'resources/resource';
import { templateService } from 'services';
import { templateResource } from 'resources';
import { routeModel } from 'utils/verifyModel';

const show = catchRequestAsync(async (req, res) => {
  const template = routeModel(req.models.template);

  res.json(resource(templateResource(template)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const templates = await templateService.queryTemplates(campId);
  const resources = templates.map((value) => templateResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;
  const template = await templateService.createTemplate(campId, data);
  res.status(httpStatus.CREATED).json(resource(templateResource(template)));
});

const update = catchRequestAsync(async (req, res) => {
  const { templateId } = req.params;
  const data = req.body;
  const template = await templateService.updateTemplateById(templateId, data);
  res.json(resource(templateResource(template)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { templateId } = req.params;
  await templateService.deleteTemplateById(templateId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
