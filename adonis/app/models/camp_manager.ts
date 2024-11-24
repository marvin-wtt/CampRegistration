import { belongsTo, column } from '@adonisjs/lucid/orm'
import { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseModel from '#models/base_model'
import Camp from '#models/camp'
import User from '#models/user'
import Invitation from '#models/invitation'

export default class CampManager extends BaseModel {
  @column()
  public declare campId: string

  @column()
  public declare userId: string | null

  @column()
  public declare invitationId: string | null

  @belongsTo(() => Camp, { foreignKey: 'campId' })
  public declare camp: BelongsTo<typeof Camp>

  @belongsTo(() => User, { foreignKey: 'userId' })
  public declare user: BelongsTo<typeof User>

  @belongsTo(() => Invitation, { foreignKey: 'invitationId' })
  public declare invitation: BelongsTo<typeof Invitation>
}
