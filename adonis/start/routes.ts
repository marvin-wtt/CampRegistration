/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('register', [AuthController, 'login'])
        router.post('register', [AuthController, 'logout'])
        router.post('register', [AuthController, 'register'])
        router.post('register', [AuthController, 'refreshTokens'])
        router.post('register', [AuthController, 'forgotPassword'])
        router.post('register', [AuthController, 'resetPassword'])
        router.post('register', [AuthController, 'sendVerificationEmail'])
        router.post('register', [AuthController, 'verifyEmail'])
      })
      .prefix('auth')

    // TODO
  })
  .prefix('/api/v1')
