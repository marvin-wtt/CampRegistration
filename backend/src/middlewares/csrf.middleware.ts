import { doubleCsrf } from 'csrf-csrf';
import config from '#config/index';

const secure = config.env !== 'development';

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.csrf.secret,
  getSessionIdentifier: (req) => {
    if (!req.sessionId) {
      throw new Error('Session ID is not set for the request.');
    }

    return req.sessionId;
  },
  cookieName: secure ? '__Host-x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure,
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  skipCsrfProtection: (req) => req.isUnauthenticated(),
});

export const csrfProtection = doubleCsrfProtection;
