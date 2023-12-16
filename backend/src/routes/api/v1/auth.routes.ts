import express from 'express';
import { validate, auth, authLimiter, guest } from 'middlewares';
import { authValidation } from 'validations';
import { authController } from 'controllers';

const router = express.Router();

// Limit number of requests
router.use(authLimiter);

// Route definitions
router.post(
  '/register',
  guest(),
  validate(authValidation.register),
  authController.register,
);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', auth(), authController.logout);
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  authController.refreshTokens,
);
router.post(
  '/forgot-password',
  guest(),
  validate(authValidation.forgotPassword),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  guest(),
  validate(authValidation.resetPassword),
  authController.resetPassword,
);
router.post(
  '/send-verification-email',
  auth(),
  authController.sendVerificationEmail,
);
router.post(
  '/verify-email',
  validate(authValidation.verifyEmail),
  authController.verifyEmail,
);

export default router;
