import express from 'express';
import { staticLimiter } from '#middlewares/rateLimiter.middleware';
import path from 'path';
import projectRoot from '#utils/paths';

const router = express.Router();

router.use(staticLimiter);

// public content
router.use(express.static('public'));

// Serve frontend content
// TODO Is there a better way to load the files?
const spaPath = path.resolve(projectRoot, '..', 'frontend', 'dist', 'spa');
router.use(
  express.static(spaPath, {
    maxAge: 300000,
  }),
);

// Respond all other get requests with frontend content
router.get('*splat', (_req, res) => {
  res.sendFile(path.resolve(spaPath, 'index.html'));
});

export default router;
