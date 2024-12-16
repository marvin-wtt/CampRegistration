import express from 'express';
import apiRoutes from './api/index.js';
import staticRoutes from './static/index.js';

const router = express.Router();

router.use('/api', apiRoutes);
router.use(staticRoutes);

export default router;
