import express from 'express';
import { auth, authLimiter, guest } from '#middlewares/index';
import authController from './auth.controller.js';
import { controller } from '#utils/bindController';

const router = express.Router();

// Limit number of requests
router.use(authLimiter);

// Route definitions
router.post('/register', guest(), controller(authController, 'register'));
router.post('/login', controller(authController, 'login'));
router.post('/verify-otp', controller(authController, 'verifyOTP'));
router.post('/logout', auth(), controller(authController, 'logout'));
router.post('/refresh-tokens', controller(authController, 'refreshTokens'));
router.post(
  '/forgot-password',
  guest(),
  controller(authController, 'forgotPassword'),
);
router.post(
  '/reset-password',
  guest(),
  controller(authController, 'resetPassword'),
);
router.post(
  '/send-verification-email',
  controller(authController, 'sendVerificationEmail'),
);
router.post('/verify-email', controller(authController, 'verifyEmail'));

export default router;
