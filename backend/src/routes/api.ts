import { generalLimiter, maintenance } from '#middlewares/index';
import passport from 'passport';
import morgan from '#core/morgan';
import extensions from '#middlewares/extension.middleware';
import { createRouter } from '#core/router';

const router = createRouter();

router.use(morgan.successHandler);

router.use(generalLimiter);
router.use(maintenance);
router.use(extensions);
router.use(passport.authenticate(['jwt', 'anonymous'], { session: false }));

export default router;
