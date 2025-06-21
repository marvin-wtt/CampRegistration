import { generalLimiter, maintenance } from '#middlewares/index';
import passport from 'passport';
import morgan from '#core/morgan';
import extensions from '#middlewares/extension.middleware';
import { createRouter } from '#core/router/router';
import { csrfProtection } from '#middlewares/csrf.middleware';
import { sessionId } from '#middlewares/session.middleware';

const router = createRouter()
  // logging
  .use(morgan.successHandler)

  // global rate‐limit & maintenance‐mode
  .use(maintenance)
  .use(generalLimiter)

  // session management
  .use(sessionId)

  // custom request‐extensions
  .use(extensions)

  // authentication
  .use(passport.authenticate(['jwt', 'anonymous'], { session: false }))

  // csrf protection
  .use(csrfProtection);

export default router;
