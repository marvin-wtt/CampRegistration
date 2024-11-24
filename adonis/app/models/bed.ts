import { belongsTo, column } from '@adonisjs/lucid/orm'
import BaseModel from '#models/base_model'
import { BelongsTo } from '@adonisjs/lucid/types/relations'
import Room from '#models/room'
import Registration from '#models/registration'

export default class Bed extends BaseModel {
  @column()
  declare roomId: string

  @column()
  declare registrationId: string | null

  @belongsTo(() => Room, { foreignKey: 'roomId' })
  declare room: BelongsTo<typeof Room>

  @belongsTo(() => Registration, { foreignKey: 'registrationId' })
  declare registration: BelongsTo<typeof Registration>
}
