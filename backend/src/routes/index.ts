import express from 'express';
import apiRoutes from './api';
import staticRoutes from './static';

const router = express.Router();

router.use('/api', apiRoutes);
router.use(staticRoutes);

export default router;
