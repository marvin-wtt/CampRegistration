import { generalLimiter } from '#core/rate-limit/limiters';
import maintenance from '#core/router/maintenance.middleware';
import passport from 'passport';
import { successHandler, clientErrorHandler } from '#core/morgan';
import context, {
  authenticatedUserContext,
} from '#core/context/context.middleware';
import extensions from '#core/router/extension.middleware';
import { createRouter } from '#core/router/router';
import { csrfProtection } from '#core/auth/csrf.middleware';
import { sessionId } from '#core/auth/session.middleware';
import convertEmptyStringsToNull from '#core/router/string.middleware';
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

  // the authenticated user, for the audit log
  .use(authenticatedUserContext)

  // csrf protection
  .use(csrfProtection)

  // converters
  .use(convertEmptyStringsToNull);

export default router;
