import factory from '@adonisjs/lucid/factories'
import TableTemplate from '#models/table_template'

export const TableTemplateFactory = factory
  .define(TableTemplate, async ({ faker }) => {
    return {}
  })
  .build()