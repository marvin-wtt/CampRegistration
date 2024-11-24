// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { createCampValidator, updateCampValidator } from '#validators/camp_validator'

export default class CampManagersController {
  async index({}: HttpContext) {
    // TODO
  }

  async show({ params }: HttpContext) {
    // TODO
  }

  async store({ request }: HttpContext) {
    // TODO
  }

  async update({ params, request }: HttpContext) {
    // TODO
  }

  async destroy({ params }: HttpContext) {
    // TODO
  }
}
