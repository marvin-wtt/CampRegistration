import { belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import BaseModel from '#models/base_model'
import Camp from '#models/camp'
import Bed from '#models/bed'
import File from '#models/file'

export default class Registration extends BaseModel {
  @column()
  declare campId: string | null

  @column()
  declare data: Record<string, any>

  @column()
  declare campData: Record<string, any>

  @column()
  declare locale: string

  @column()
  declare waitingList: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt?: DateTime

  @belongsTo(() => Camp, { foreignKey: 'campId' })
  declare camp: BelongsTo<typeof Camp>

  @hasOne(() => Bed, { foreignKey: 'registrationId' })
  declare bed: HasOne<typeof Bed>

  @hasMany(() => File, { foreignKey: 'registrationId' })
  declare files: HasMany<typeof File>
}
