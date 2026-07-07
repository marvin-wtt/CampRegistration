import { generalLimiter, maintenance } from '#middlewares/index';
import passport from 'passport';
import { successHandler, clientErrorHandler } from '#core/morgan';
import context from '#middlewares/context.middleware';
import extensions from '#middlewares/extension.middleware';
import { createRouter } from '#core/router/router';
import { csrfProtection } from '#middlewares/csrf.middleware';
import { sessionId } from '#middlewares/session.middleware';
import convertEmptyStringsToNull from '#middlewares/string.middleware';
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

  // ambient request context (AsyncLocalStorage) for the rest of the chain
  .use(context)

  // custom request‐extensions
  .use(extensions)

  // authentication
  .use(passport.authenticate(['jwt', 'anonymous'], { session: false }))

  // csrf protection
  .use(csrfProtection)

  // converters
  .use(convertEmptyStringsToNull);

export default router;
