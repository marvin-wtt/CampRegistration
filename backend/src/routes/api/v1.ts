import express from 'express';
import campRoutes from '#app/camp/camp.routes';
import authRoutes from '#app/auth/auth.routes';
import profileRoutes from '#app/profile/profile.routes';
import userRoutes from '#app/user/user.routes';
import feedbackRoutes from '#app/feedback/feedback.routes';
import fileRoutes from '#app/file/file.routes';
import totpRoutes from '#app/totp/totp.routes';
import httpStatus from 'http-status';
import extensions from '#middlewares/extension.middleware';

const router = express.Router();

router.use(extensions);

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
