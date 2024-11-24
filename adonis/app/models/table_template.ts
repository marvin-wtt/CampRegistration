import { belongsTo, column } from '@adonisjs/lucid/orm'
import BaseModel from '#models/base_model'
import Camp from '#models/camp'
import { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TableTemplate extends BaseModel {
  @column()
  declare campId: string

  @column()
  declare data: Record<string, any>

  @belongsTo(() => Camp, { foreignKey: 'campId' })
  declare camp: BelongsTo<typeof Camp>
}
