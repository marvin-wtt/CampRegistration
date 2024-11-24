import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'table_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 26).primary()
      table.string('camp_id', 26).notNullable().index()
      table.json('data').notNullable()

      table
        .foreign('camp_id')
        .references('id')
        .inTable('camps')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
