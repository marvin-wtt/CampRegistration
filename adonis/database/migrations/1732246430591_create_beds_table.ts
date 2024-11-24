import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'beds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 26).primary()
      table.string('room_id', 26).notNullable().index()
      table.string('registration_id', 26).nullable().unique().index()

      table
        .foreign('room_id')
        .references('id')
        .inTable('rooms')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .foreign('registration_id')
        .references('id')
        .inTable('registrations')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
