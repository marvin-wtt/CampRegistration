import { belongsTo, column } from '@adonisjs/lucid/orm'
import BaseModel from '#models/base_model'
import { BelongsTo } from '@adonisjs/lucid/types/relations'
import Camp from '#models/camp'
import Registration from '#models/registration'

export default class File extends BaseModel {
  @column()
  declare campId: string | null

  @column()
  declare registrationId: string | null

  @column()
  declare name: string

  @column()
  declare originalName: string

  @column()
  declare field: string | null

  @column()
  declare type: string

  @column()
  declare size: number

  @column()
  declare accessLevel: string | null

  @column()
  declare storageLocation: string

  @belongsTo(() => Camp, { foreignKey: 'campId' })
  declare camp: BelongsTo<typeof Camp>

  @belongsTo(() => Registration, { foreignKey: 'registrationId' })
  declare registration: BelongsTo<typeof Registration>
}
