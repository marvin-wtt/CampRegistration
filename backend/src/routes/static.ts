import express from 'express';
import { staticLimiter } from '#middlewares/rateLimiter.middleware';
import { spaIndexPath, spaPath } from '#utils/paths';
import webRoutes from '#routes/web';

const router = express.Router();

router.use(staticLimiter);

// public content
router.use(express.static('public'));

// Serve frontend content
router.use(
  express.static(spaPath(), {
    maxAge: 300000,
  }),
);

// Browser-facing module routes (link previews, ...). After the built assets, so
// a bundle never pays for the router; ahead of the shell below, so a route here
// can claim a path the SPA would otherwise swallow. Anything they decline falls
// through to the shell.
router.use(webRoutes);

// Respond all other get requests with frontend content
router.get('*splat', (_req, res) => {
  res.sendFile(spaIndexPath());
});

export default router;
