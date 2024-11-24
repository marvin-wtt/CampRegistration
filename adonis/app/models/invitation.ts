import { column, hasMany } from '@adonisjs/lucid/orm'
import BaseModel from '#models/base_model'
import CampManager from '#models/camp_manager'
import { HasMany } from '@adonisjs/lucid/types/relations'

export default class Invitation extends BaseModel {
  @column()
  declare email: string

  @hasMany(() => CampManager, { foreignKey: 'invitationId' })
  declare campManagers: HasMany<typeof CampManager>
}
