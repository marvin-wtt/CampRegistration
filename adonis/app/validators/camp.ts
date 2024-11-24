import vine from '@vinejs/vine'
import type { SchemaTypes } from '@vinejs/vine/types'

function translation(schema: SchemaTypes) {
  return vine
    .unionOfTypes([
      schema.clone(),
      vine.record(schema.clone()).validateKeys((keys, field) => {
        if (!('countries' in field.data)) {
          return
        }

        const countries = field.data.countries as string[]
        for (const key of keys) {
          if (countries.includes(key)) {
            continue
          }

          field.report(
            `The {{ field }} field must not contain value for unknown key ${key}`,
            'translation_key',
            field
          )
          return
        }
      }),
    ])
    .clone()
}

const dateTimeSchema = vine.date({
  formats: ['YYYY-MM-DDTHH:mm:ss.SSSZ'],
})

const localeRule = vine.createRule((value, _, field) => {
  if (!Array.isArray(value)) {
    return
  }

  const locales = Intl.getCanonicalLocales(value)
  if (locales.length !== value.length) {
    field.report('The {{ field }} field must contain only locales', 'locale', field)
  }
})

const greaterThanOrEqualAsRule = vine.createRule((value, options: { field: string }, field) => {
  if (typeof value !== 'number') {
    return
  }

  if (!(options.field in field.data)) {
    field.report('The reference field of the {{ field }} does not exist', 'locale', field)
    return
  }

  const reference = field.data[options.field]
  if (typeof reference !== 'number') {
    field.report(
      `The reference field of the {{ field }} field must be numeric`,
      'reference_type',
      field
    )
    return
  }

  if (reference < value) {
    field.report(
      `The {{ field }} field must be greater than or equal to ${options.field} field value`,
      'greater_than_or_equal',
      field
    )
    return
  }
})

export const createCampValidator = vine.compile(
  vine.object({
    active: vine.boolean(),
    public: vine.boolean(),
    countries: vine.array(vine.string()).minLength(1).use(localeRule()),
    name: translation(vine.string()),
    organizer: translation(vine.string()),
    contactEmail: translation(vine.string()),
    maxParticipants: translation(vine.number().positive().withoutDecimals()),
    startAt: dateTimeSchema.clone(),
    endAt: dateTimeSchema.clone().afterField('startAt'),
    minAge: vine.number().withoutDecimals().positive(),
    maxAge: vine
      .number()
      .withoutDecimals()
      .use(greaterThanOrEqualAsRule({ field: 'minAge' })),
    location: translation(vine.string()),
    price: vine.number().min(0).decimal([0, 2]),
    form: vine.object({}).allowUnknownProperties(), // TODO Validate form
    themes: vine.record(vine.string()),
    referenceCampId: vine.string(),
  })
)

// TODO How to make translation optional?
export const updateCampValidator = vine.compile(
  vine.object({
    active: vine.boolean().optional(),
    public: vine.boolean().optional(),
    countries: vine.array(vine.string()).minLength(1).use(localeRule()).optional(),
    name: translation(vine.string()),
    organizer: translation(vine.string()),
    contactEmail: translation(vine.string()),
    maxParticipants: translation(vine.number().positive().withoutDecimals()),
    startAt: dateTimeSchema.clone().optional(),
    endAt: dateTimeSchema.clone().afterField('startAt').optional(),
    minAge: vine.number().withoutDecimals().positive().optional(), // TODO Required if maxAge is set
    maxAge: vine
      .number()
      .withoutDecimals()
      .use(greaterThanOrEqualAsRule({ field: 'minAge' }))
      .optional(),
    location: translation(vine.string()),
    price: vine.number().min(0).decimal([0, 2]).optional(),
    form: vine.object({}).allowUnknownProperties().optional(), // TODO Validate form
    themes: vine.record(vine.string()).optional(),
    referenceCampId: vine.string().optional(),
  })
)
