import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 26).primary()
      table.string('name', 255).notNullable()
      table.string('email', 255).unique().notNullable()
      table.boolean('email_verified').defaultTo(false)
      table.string('password', 255).notNullable()
      table.enum('role', ['USER', 'ADMIN']).defaultTo('USER').notNullable()
      table.string('locale', 5).defaultTo('en-US').notNullable()
      table.boolean('locked').defaultTo(false)
      table.timestamp('last_seen').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
