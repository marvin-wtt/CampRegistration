import { z } from 'zod/v4';
import { translatedValue } from '#core/validation/helper';

const StringOrFunctionSchema = z.union([z.string()]);

const TableTemplateBodySchema = z.object({
  title: translatedValue(z.string()),
  columns: z.array(
    z.object({
      name: z.string(),
      source: z.enum(['form', 'custom']).optional(),
      field: StringOrFunctionSchema,
      label: translatedValue(z.string()),
      required: z.boolean().optional(),
      align: z.enum(['left', 'right', 'center']).optional(),
      sortable: z.boolean().optional(),
      sortOrder: z.enum(['ad', 'da']).optional(),
      style: StringOrFunctionSchema.optional(),
      classes: StringOrFunctionSchema.optional(),
      headerStyle: z.string().optional(),
      headerClasses: z.string().optional(),
      renderAs: z.string().optional(),
      renderOptions: z.unknown().nullable().optional(),
      isArray: z.boolean().optional(),
      headerVertical: z.boolean().optional(),
      shrink: z.boolean().optional(),
      hideIf: z.string().nullable().optional(),
      showIf: z.string().nullable().optional(),
    }),
  ),
  order: z.number(),
  filter: z.string().nullable().optional(),
  filterWaitingList: z.enum(['include', 'exclude', 'only']).optional(),
  filterRoles: z.array(z.string()).optional(),
  printOptions: z
    .object({
      orientation: z.enum(['portrait', 'landscape']).optional(),
    })
    .optional(),
  indexed: z.boolean().optional(),
  actions: z.boolean().optional(),
  sortBy: z.string().nullable().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  generated: z.boolean().optional(),
});

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    tableTemplateId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: TableTemplateBodySchema,
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    tableTemplateId: z.ulid(),
  }),
  body: TableTemplateBodySchema,
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    tableTemplateId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
