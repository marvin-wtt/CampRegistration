import express from 'express';
import campRoutes from '#app/camp/camp.routes';
import authRoutes from '#app/auth/auth.routes';
import profileRoutes from '#app/profile/profile.routes';
import userRoutes from '#app/user/user.routes';
import feedbackRoutes from '#app/feedback/feedback.routes';
import fileRoutes from '#app/file/file.routes';
import totpRoutes from '#app/totp/totp.routes';
import httpStatus from 'http-status';
import routeModels from '#middlewares/model.middleware';
import emptyBody from '#middlewares/body.middleware';
import validation from '#middlewares/validate.middleware';

const router = express.Router();

// Backwards compatibility with express 4.
// Validation fails otherwise due to body being undefined
router.use(emptyBody);

// Validation
router.use(validation);

// Initialize models
router.use(routeModels);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/camps', campRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/files', fileRoutes);
router.use('/totp', totpRoutes);

// Simple health check to see if the API is available
router.get('/health', (_req, res) => {
  res.sendStatus(httpStatus.OK);
});

export default router;
