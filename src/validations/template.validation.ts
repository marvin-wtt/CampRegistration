import Joi from "joi";

const TemplateBodySchema = Joi.object({
  title: Joi.alternatives()
    .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
    .required(),
  columns: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        field: Joi.alternatives().try(Joi.string(), Joi.function()).required(),
        label: Joi.alternatives()
          .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
          .required(),
        required: Joi.boolean(),
        align: Joi.string().valid("left", "right", "center"),
        sortable: Joi.boolean(),
        sort: Joi.function(),
        sort_order: Joi.string().valid("ad", "da"),
        format: Joi.function(),
        style: Joi.alternatives().try(Joi.string(), Joi.function()),
        classes: Joi.alternatives().try(Joi.string(), Joi.function()),
        header_style: Joi.string(),
        header_classes: Joi.string(),
        render_as: Joi.string(),
        render_options: Joi.object(),
        header_vertical: Joi.boolean(),
        shrink: Joi.boolean(),
        hide_if: Joi.string(),
        show_if: Joi.string(),
      })
    )
    .required(),
  order: Joi.number().required(),
  filter: Joi.string(),
  filter_waiting_list: Joi.boolean(),
  filter_leaders: Joi.boolean(),
  filter_participants: Joi.boolean(),
  print_options: Joi.object({
    orientation: Joi.string().valid("portrait", "landscape"),
  }),
  indexed: Joi.boolean(),
  actions: Joi.boolean(),
  sort_by: Joi.string(),
  sort_direction: Joi.string().valid("asc", "desc"),
  generated: Joi.boolean(),
}).options({ stripUnknown: true });

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
  body: TemplateBodySchema,
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
    templateId: Joi.string(),
  }),
  body: TemplateBodySchema,
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
