import factory from '@adonisjs/lucid/factories'
import Bed from '#models/bed'

export const BedFactory = factory
  .define(Bed, async ({ faker }) => {
    return {}
  })
  .build()
