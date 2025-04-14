import express from 'express';
import apiRoutes from '#routes/api';
import staticRoutes from '#routes/static';

const router = express.Router();

router.use('/api', apiRoutes);
router.use(staticRoutes);

export default router;
