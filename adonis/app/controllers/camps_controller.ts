// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { createCampValidator, updateCampValidator } from '#validators/camp'

export default class CampsController {
  async index({}: HttpContext) {
    // TODO
  }

  async show({ params }: HttpContext) {
    // TODO
  }

  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createCampValidator)
    // TODO
  }

  async update({ params, request }: HttpContext) {
    const payload = request.validateUsing(updateCampValidator)
    // TODO
  }

  async destroy({ params }: HttpContext) {
    // TODO
  }
}
