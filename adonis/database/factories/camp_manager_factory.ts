import factory from '@adonisjs/lucid/factories'
import CampManager from '#models/camp_manager'

export const CampManagerFactory = factory
  .define(CampManager, async ({ faker }) => {
    return {}
  })
  .build()