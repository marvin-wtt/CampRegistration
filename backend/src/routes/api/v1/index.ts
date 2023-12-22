import express from 'express';
import campRoutes from './camps/camp.routes';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import userRoutes from './user.routes';
import feedbackRoutes from './feedback.routes';

const router = express.Router();

// Initialize models
router.use((req, res, next) => {
  req.models = {};
  next();
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/camps', campRoutes);
router.use('/feedback', feedbackRoutes);

// Simple health check to see if the API is available
router.get('/health', (req, res) => {
  res.sendStatus(200);
});

export default router;
