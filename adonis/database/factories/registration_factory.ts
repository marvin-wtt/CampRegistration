import factory from '@adonisjs/lucid/factories'
import Registration from '#models/registration'

export const RegistrationFactory = factory
  .define(Registration, async ({ faker }) => {
    return {}
  })
  .build()