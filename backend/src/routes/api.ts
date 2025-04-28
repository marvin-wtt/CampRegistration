import { generalLimiter, maintenance } from '#middlewares/index';
import passport from 'passport';
import morgan from '#core/morgan';
import extensions from '#middlewares/extension.middleware';
import { createRouter } from '#core/router';
import { csrfProtection } from '#middlewares/csrf.middleware';
import { sessionId } from '#middlewares/session.middleware';

const router = createRouter();

router.use(morgan.successHandler);

router.use(generalLimiter);
router.use(maintenance);

// Custom methods
router.use(extensions);

// Session id
router.use(sessionId);

// Authentication
router.use(passport.authenticate(['jwt', 'anonymous'], { session: false }));

// CSRF protection
router.use(csrfProtection);

export default router;
