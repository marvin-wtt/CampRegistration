import { DateTime } from 'luxon'
import { column, hasMany } from '@adonisjs/lucid/orm'
import BaseModel from '#models/base_model'
import { HasMany } from '@adonisjs/lucid/types/relations'
import CampManager from '#models/camp_manager'
import Registration from '#models/registration'
import Room from '#models/room'
import TableTemplate from '#models/table_template'
import File from '#models/file'

export default class Camp extends BaseModel {
  @column()
  declare active: boolean

  @column()
  declare public: boolean

  @column({ columnName: 'countries', serializeAs: null })
  declare countries: Record<string, any>

  @column({ columnName: 'name' })
  declare name: Record<string, any>

  @column({ columnName: 'organizer' })
  declare organizer: Record<string, any>

  @column({ columnName: 'contact_email' })
  declare contactEmail: Record<string, any>

  @column({ columnName: 'max_participants' })
  declare maxParticipants: Record<string, any>

  @column({ columnName: 'free_places' })
  declare freePlaces: Record<string, any>

  @column({ columnName: 'min_age' })
  declare minAge: number

  @column({ columnName: 'max_age' })
  declare maxAge: number

  @column.dateTime({ columnName: 'start_at' })
  declare startAt: DateTime

  @column.dateTime({ columnName: 'end_at' })
  declare endAt: DateTime

  @column()
  declare price: number

  @column({ columnName: 'location' })
  declare location?: Record<string, any>

  @column()
  declare form: Record<string, any>

  @column({ columnName: 'themes' })
  declare themes: Record<string, any>

  @column()
  declare version: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt?: DateTime

  @hasMany(() => CampManager, { foreignKey: 'campId' })
  declare campManager: HasMany<typeof CampManager>

  @hasMany(() => Registration, { foreignKey: 'campId' })
  declare registrations: HasMany<typeof Registration>

  @hasMany(() => Room, { foreignKey: 'campId' })
  declare rooms: HasMany<typeof Room>

  @hasMany(() => TableTemplate, { foreignKey: 'campId' })
  declare templates: HasMany<typeof TableTemplate>

  @hasMany(() => File, { foreignKey: 'campId' })
  declare files: HasMany<typeof File>
}
