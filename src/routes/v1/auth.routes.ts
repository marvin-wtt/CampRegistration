import express from "express";
import { validate, auth, authLimiter } from "../../middlewares";
import { authValidation } from "../../validations";
import { authController } from "../../controllers";

const router = express.Router();

// Limit number of requests
router.use(authLimiter);

// Route definitions
router.post(
  "/register",
  validate(authValidation.register),
  authController.register
);
router.post("/login", validate(authValidation.login), authController.login);
router.post(
  "/logout",
  auth(),
  validate(authValidation.logout),
  authController.logout
);
router.post(
  "/refresh-tokens",
  auth(),
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);
router.post(
  "/forgot-password",
  auth(),
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  auth(),
  validate(authValidation.resetPassword),
  authController.resetPassword
);
router.post(
  "/send-verification-email",
  auth(),
  authController.sendVerificationEmail
);
router.post(
  "/verify-email",
  auth(),
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

export default router;
