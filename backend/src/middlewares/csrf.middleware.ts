import { doubleCsrf } from 'csrf-csrf';
import config from '#config/index';

const secure = config.env !== 'development';

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.csrf.secret,
  getSessionIdentifier: (req) => {
    // Use user ID for authenticated users instead of session ID
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (req.isAuthenticated() && req.user?.id) {
      return String(req.user.id);
    }
    // Fall back to session ID for unauthenticated users
    return req.sessionId ?? '';
  },
  cookieName: secure ? '__Host-x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure,
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  skipCsrfProtection: (req) => {
    if (req.isUnauthenticated()) {
      return true;
    }

    // Ignore for header-based authentication
    return req.headers.authorization !== undefined;
  },
});

export const csrfProtection = doubleCsrfProtection;
