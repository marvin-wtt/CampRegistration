import { BaseModel as AdonisBaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { ulid } from 'ulidx'

export default class BaseModel extends AdonisBaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignId(model: BaseModel) {
    model.id = ulid()
  }
}
