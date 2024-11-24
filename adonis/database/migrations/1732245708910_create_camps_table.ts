import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'camps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 26).primary()
      table.boolean('active').notNullable()
      table.boolean('public').notNullable()
      table.json('countries').notNullable()
      table.json('name').notNullable()
      table.json('organizer').notNullable()
      table.json('contact_email').notNullable()
      table.json('max_participants').notNullable()
      table.json('free_places').notNullable()
      table.integer('min_age').unsigned().notNullable()
      table.integer('max_age').unsigned().notNullable()
      table.timestamp('start_at', { useTz: true }).notNullable()
      table.timestamp('end_at', { useTz: true }).notNullable()
      table.float('price').notNullable()
      table.json('location').nullable()
      table.json('form').notNullable()
      table.json('themes').defaultTo('{}').notNullable()
      table.integer('version').unsigned().defaultTo(1).notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
