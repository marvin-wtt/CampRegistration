import { generalLimiter, maintenance } from '#middlewares/index';
import passport from 'passport';
import { successHandler, clientErrorHandler } from '#core/morgan';
import extensions from '#middlewares/extension.middleware';
import { createRouter } from '#core/router/router';
import { csrfProtection } from '#middlewares/csrf.middleware';
import { sessionId } from '#middlewares/session.middleware';
import convertEmptyStringsToNull from '#middlewares/string.middleware';
import { requestContext } from '#middlewares/request-context.middleware';
import { initializePassport } from '#core/passport';

// authentication
initializePassport();

const router = createRouter()
  // logging
  .use(successHandler)
  .use(clientErrorHandler)

  // global rate‐limit & maintenance‐mode
  .use(maintenance)
  .use(generalLimiter)

  // session management
  .use(sessionId)

  // custom request‐extensions
  .use(extensions)

  // authentication
  .use(passport.authenticate(['jwt', 'anonymous'], { session: false }))

  // request-scoped context (needs req.user from passport + req.sessionId)
  .use(requestContext)

  // csrf protection
  .use(csrfProtection)

  // converters
  .use(convertEmptyStringsToNull);

export default router;
