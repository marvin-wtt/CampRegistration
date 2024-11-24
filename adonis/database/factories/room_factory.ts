import factory from '@adonisjs/lucid/factories'
import Room from '#models/room'

export const RoomFactory = factory
  .define(Room, async ({ faker }) => {
    return {}
  })
  .build()