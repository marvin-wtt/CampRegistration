import express from 'express';
import { staticLimiter } from 'middlewares';
import path from 'path';

const router = express.Router();

router.use(staticLimiter);

// public content
router.use(express.static('public'));

// Serve frontend content
// TODO Is there a better way to load the files?
const spaPath = path.join('..', 'frontend', 'dist', 'spa');
router.use(
  express.static(spaPath, {
    maxAge: 300000,
  }),
);

// Respond all other get requests with frontend content
router.get('*', (req, res) => {
  res.sendFile(path.resolve(spaPath, 'index.html'));
});

export default router;
