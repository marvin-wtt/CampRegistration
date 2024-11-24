import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import BaseModel from '#models/base_model'
import CampManager from '#models/camp_manager'
import { HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

// TODO Refresh token
// TODO Hash password
export default class User extends compose(BaseModel, AuthFinder) {
  @column()
  declare name: string

  @column()
  declare email: string

  @column({ columnName: 'email_verified' })
  declare emailVerified: boolean

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'USER' | 'ADMIN'

  @column()
  declare locale: string

  @column()
  declare locked: boolean

  @column.dateTime({ columnName: 'last_seen' })
  declare lastSeen?: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt?: DateTime

  @hasMany(() => CampManager, { foreignKey: 'userId' })
  declare camps: HasMany<typeof CampManager>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
