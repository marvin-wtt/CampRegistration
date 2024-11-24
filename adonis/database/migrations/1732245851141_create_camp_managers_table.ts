import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'camp_managers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 26).primary()
      table.string('camp_id', 26).notNullable().index()
      table.string('user_id', 26).nullable().index()
      table.string('invitation_id', 26).nullable().index()

      table
        .foreign('camp_id')
        .references('id')
        .inTable('camps')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .foreign('invitation_id')
        .references('id')
        .inTable('invitations')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
