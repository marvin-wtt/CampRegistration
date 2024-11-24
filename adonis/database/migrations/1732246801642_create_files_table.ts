import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 26).primary()
      table.string('camp_id', 36).nullable().index()
      table.string('registration_id', 36).nullable().index()
      table.string('name').notNullable()
      table.string('original_name').notNullable()
      table.string('field').nullable()
      table.string('type').notNullable()
      table.integer('size').notNullable()
      table.string('access_level').nullable()
      table.string('storage_location').notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      table
        .foreign('camp_id')
        .references('id')
        .inTable('camps')
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
