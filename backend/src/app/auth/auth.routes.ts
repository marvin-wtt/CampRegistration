import express from 'express';
import { auth, authLimiter, guest } from 'middlewares';
import authController from './auth.controller';

const router = express.Router();

// Limit number of requests
router.use(authLimiter);

// Route definitions
router.post('/register', guest(), authController.register);
router.post('/login', authController.login);
router.post('/logout', auth(), authController.logout);
router.post('/refresh-tokens', authController.refreshTokens);
router.post('/forgot-password', guest(), authController.forgotPassword);
router.post('/reset-password', guest(), authController.resetPassword);
router.post(
  '/send-verification-email',
  auth(),
  authController.sendVerificationEmail,
);
router.post('/verify-email', authController.verifyEmail);

export default router;
