import factory from '@adonisjs/lucid/factories'
import File from '#models/file'

export const FileFactory = factory
  .define(File, async ({ faker }) => {
    return {}
  })
  .build()