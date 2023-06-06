import Joi from "joi";

const validateTemplateBody = Joi.object({
  title: Joi.string().required(),
  columns: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      label: Joi.object().unknown().required(), // Assuming `Translation` is a custom validation rule
      field: Joi.string(),
      required: Joi.boolean().allow(null),
      align: Joi.string().valid("left", "right", "center"),
      sortable: Joi.boolean().allow(null),
      sortOrder: Joi.string().valid("ad", "da"),
      headerStyle: Joi.string().allow(null),
      headerClasses: Joi.string().allow(null),
      renderAs: Joi.string().allow(null),
      renderOptions: Joi.array().allow(null),
      headerVertical: Joi.boolean().allow(null),
      shrink: Joi.boolean().allow(null),
      hideIf: Joi.string().allow(null),
      showIf: Joi.string().allow(null),
      style: Joi.string().allow(null),
      classes: Joi.string().allow(null),
    })
  ),
  order: Joi.number().integer().required(),
  filter: Joi.string().allow(null),
  filter_waiting_list: Joi.boolean().allow(null),
  filter_leaders: Joi.boolean().allow(null),
  filter_participants: Joi.boolean().allow(null),
  printOptions: Joi.object({
    orientation: Joi.string().valid("portrait", "landscape"),
  }),
  indexed: Joi.boolean().allow(null),
  actions: Joi.boolean().allow(null),
  sortBy: Joi.string().allow(null),
  sortDirection: Joi.string().valid("asc", "desc").allow(null),
});

const show = {
  params: Joi.object({
    campId: Joi.string(),
    templateId: Joi.string(),
  }),
};

const index = {
  params: Joi.object({
    campId: Joi.string(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string(),
  }),
  body: validateTemplateBody,
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
    templateId: Joi.string(),
  }),
  body: validateTemplateBody,
};

const destroy = {
  params: Joi.object({
    campId: Joi.string(),
    templateId: Joi.string(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
