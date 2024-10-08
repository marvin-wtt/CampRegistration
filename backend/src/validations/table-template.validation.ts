import Joi from 'joi';
import {
  TableTemplate,
  TableColumnTemplate,
} from '@camp-registration/common/entities';

const TableTemplateBodySchema = Joi.object<TableTemplate>()
  .keys({
    title: Joi.alternatives()
      .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
      .required(),
    columns: Joi.array()
      .items(
        Joi.object<TableColumnTemplate>({
          name: Joi.string().required(),
          field: Joi.alternatives()
            .try(Joi.string(), Joi.function())
            .required(),
          label: Joi.alternatives()
            .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
            .required(),
          required: Joi.boolean(),
          align: Joi.string().valid('left', 'right', 'center'),
          sortable: Joi.boolean(),
          sortOrder: Joi.string().valid('ad', 'da'),
          style: Joi.alternatives().try(Joi.string(), Joi.function()),
          classes: Joi.alternatives().try(Joi.string(), Joi.function()),
          headerStyle: Joi.string(),
          headerClasses: Joi.string(),
          renderAs: Joi.string(),
          renderOptions: Joi.object().allow(null),
          isArray: Joi.boolean(),
          editable: Joi.boolean(),
          headerVertical: Joi.boolean(),
          shrink: Joi.boolean(),
          hideIf: Joi.string().allow(null),
          showIf: Joi.string().allow(null),
        }),
      )
      .required(),
    order: Joi.number().required(),
    filter: Joi.string().allow(null),
    filterWaitingList: Joi.string().valid('include', 'exclude', 'only'),
    filterRoles: Joi.array<string>(),
    printOptions: Joi.object({
      orientation: Joi.string().valid('portrait', 'landscape'),
    }),
    indexed: Joi.boolean(),
    actions: Joi.boolean(),
    sortBy: Joi.string().allow(null),
    sortDirection: Joi.string().valid('asc', 'desc'),
    generated: Joi.boolean(),
  })
  .options({ stripUnknown: true });

const show = {
  params: Joi.object({
    campId: Joi.string().required(),
    templateId: Joi.string().required(),
  }),
};

const index = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
  body: TableTemplateBodySchema,
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    templateId: Joi.string().required(),
  }),
  body: TableTemplateBodySchema,
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
    templateId: Joi.string().required(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
