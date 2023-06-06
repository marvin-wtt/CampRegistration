import catchAsync from "../utils/catchAsync";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { collection, resource } from "../resources/resource";
import { templateService } from "../services";
import { templateResource } from "../resources";
import { Prisma } from "@prisma/client";

const show = catchAsync(async (req, res) => {
  const { templateId } = req.params;
  const template = await templateService.getTemplateById(templateId);

  if (template == null) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template does not exist");
  }

  res.json(resource(templateResource(template)));
});

const index = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const templates = await templateService.queryTemplates(campId);
  const resources = templates.map((value) => templateResource(value));

  res.json(collection(resources));
});

const store = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;
  const template = await templateService.createTemplate(campId, {
    data: data,
  });
  res.status(httpStatus.CREATED).json(resource(templateResource(template)));
});

const update = catchAsync(async (req, res) => {
  const { campId, templateId } = req.params;
  const data = req.body;
  const template = await templateService.updateTemplateById(templateId, {
    data: data,
  });
  if (template == null) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Update without response."
    );
  }
  res.json(resource(templateResource(template)));
});

const destroy = catchAsync(async (req, res) => {
  const { campId, templateId } = req.params;
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
