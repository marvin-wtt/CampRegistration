import factory from '@adonisjs/lucid/factories'
import Invitation from '#models/invitation'

export const InvitationFactory = factory
  .define(Invitation, async ({ faker }) => {
    return {}
  })
  .build()