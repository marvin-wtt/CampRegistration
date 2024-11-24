import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import BaseModel from '#models/base_model'
import Camp from '#models/camp'
import Bed from '#models/bed'

export default class Room extends BaseModel {
  @column()
  declare campId: string

  @column()
  declare name: Record<string, any>

  @belongsTo(() => Camp, { foreignKey: 'campId' })
  declare camp: BelongsTo<typeof Camp>

  @hasMany(() => Bed, { foreignKey: 'roomId' })
  declare beds: HasMany<typeof Bed>
}
