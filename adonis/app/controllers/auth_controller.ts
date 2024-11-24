import type { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'

import User from '#models/user'
import { forgotPasswordValidator, loginValidator, registerValidator } from '#validators/auth'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const user = await User.create(payload)

    return response.created(user)
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    // TODO
  }

  async logout({ auth }: HttpContext) {
    // TODO
  }

  async refreshTokens() {
    // TODO
  }

  async forgotPassword({ request }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    await User.findByOrFail({ email })

    const url = router
      .builder()
      .params({
        email,
      })
      .makeSigned('reset-password', {
        expiresIn: '12h',
      })

    // TODO Send URL via email
  }

  async resetPassword({ request, auth }: HttpContext) {
    if (!request.hasValidSignature()) {
      return 'Missing or invalid signature'
    }

    // TODO Get

    // TODO
  }

  async te() {
    // TODO

    const url = router
      .builder()
      .params({
        email: '', // TODO
      })
      .makeSigned('verify-email', {
        expiresIn: '12h',
      })
  }

  async verifyEmail({ request }: HttpContext) {
    if (!request.hasValidSignature()) {
      return 'Missing or invalid signature'
    }

    // TODO
  }
}
